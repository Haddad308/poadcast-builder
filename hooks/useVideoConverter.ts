import { FFmpeg } from "@ffmpeg/ffmpeg";
import { useEffect, useRef, useState } from "react";
import useTranscription from "./useTranscription";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import useArticleGenerator from "./useArticleGenerator";

const useVideoConverter = ({
  setStatus,
  setError,
  enableTranscription,
  enableArticleGeneration,
  abortControllerRef,
}: {
  setStatus: (status: string) => void;
  setError: (error: string) => void;
  enableTranscription: boolean;
  enableArticleGeneration: boolean;
  abortControllerRef: React.RefObject<AbortController | null>;
}) => {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [video, setVideo] = useState<File | null>(null);
  const [, setAudioBlob] = useState<Blob | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const { transcribeAudio, setTranscription } = useTranscription({
    setError,
    videoName: video,
    enableArticleGeneration,
  });

  const { setArticle } = useArticleGenerator({ setError, video });

  const ffmpegRef = useRef<FFmpeg>(new FFmpeg());

  const convertToAudio = async () => {
    if (!video) {
      setError("Please select a video file first.");
      return;
    }

    try {
      setIsConverting(true);
      setStatus("Converting...");
      setProgress(0);
      setError("");
      setAudioUrl(null);
      setTranscription(null);
      setArticle(null);

      abortControllerRef.current = new AbortController();
      const ffmpeg = ffmpegRef.current;

      const inputFileName =
        "input_video" + video.name.substring(video.name.lastIndexOf("."));
      const outputFileName = "output_audio.mp3";

      await ffmpeg.writeFile(inputFileName, await fetchFile(video));
      await ffmpeg.exec([
        "-i",
        inputFileName,
        "-q:a",
        "0",
        "-map",
        "a",
        outputFileName,
      ]);

      const data = await ffmpeg.readFile(outputFileName);
      const audioBlob = new Blob([data], { type: "audio/mp3" });
      const audioUrl = URL.createObjectURL(audioBlob);

      setAudioBlob(audioBlob);
      setAudioUrl(audioUrl);
      setStatus("Conversion complete");

      // Start transcription if enabled
      if (enableTranscription) {
        await transcribeAudio(audioBlob);
      }
    } catch (error) {
      if ((error as Error).message !== "AbortError") {
        setError((error as Error).message);
      }
    } finally {
      setIsConverting(false);
    }
  };

  const loadFFmpeg = async () => {
    try {
      setStatus("Loading converter...");
      setError("");

      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      const ffmpeg = ffmpegRef.current;

      ffmpeg.on("log", ({ message }) => {
        console.log(message);
      });

      ffmpeg.on("progress", ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });

      await ffmpeg.load({
        coreURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.js`,
          "text/javascript"
        ),
        wasmURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.wasm`,
          "application/wasm"
        ),
      });

      setStatus("");
    } catch (error) {
      setError((error as Error).message);
    }
  };

  useEffect(() => {
    loadFFmpeg();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);
  return {
    convertToAudio,
    videoUrl,
    setVideoUrl,
    video,
    setVideo,
    audioUrl,
    progress,
    isConverting,
    loadFFmpeg,
    setAudioUrl,
    setAudioBlob,
    setIsConverting,
    setProgress,
  };
};

export default useVideoConverter;
