"use client";

import type React from "react";

import { useEffect, useState, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle,
  Upload,
  X,
  FileVideo,
  LinkIcon,
  Loader2,
  FileText,
  Download,
  Copy,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import isUsed from "@/firebase/check-email";

const Page = () => {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [video, setVideo] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [, setAudioBlob] = useState<Blob | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [enableTranscription, setEnableTranscription] = useState(true);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [open, setOpen] = useState(false);

  const ffmpegRef = useRef<FFmpeg>(new FFmpeg());
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    loadFFmpeg();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const loadFFmpeg = async () => {
    try {
      setStatus("Loading converter...");
      setError(null);

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      setVideo(file);
      setAudioUrl(null);
      setTranscription(null);
      setError(null);
    } else {
      setError("Please drop a valid video file");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideo(file);
      setAudioUrl(null);
      setTranscription(null);
      setError(null);
    }
  };

  const cancelConversion = () => {
    abortControllerRef.current?.abort();
    setIsConverting(false);
    setStatus("Conversion cancelled");
    setProgress(0);
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    if (!audioBlob) return;

    try {
      setIsTranscribing(true);
      setTranscriptionProgress(0);

      // Create a FormData object to send the audio file
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.mp3");
      formData.append("model", "openai/whisper-large-v3-turbo");

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setTranscriptionProgress((prev) => {
          const newProgress = prev + Math.random() * 5;
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 1000);

      // Make the API request to the Hugging Face Inference API
      const response = await fetch(
        "https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${
              process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY || "hf_dummy_key"
            }`,
          },
          body: formData,
        }
      );

      clearInterval(progressInterval);
      setTranscriptionProgress(100);

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const result = await response.json();
      setTranscription(result.text);
    } catch (error) {
      console.error("Transcription error:", error);
      setError(`Transcription failed: ${(error as Error).message}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const convertToAudio = async () => {
    if (!video) {
      setError("Please select a video file first.");
      return;
    }

    try {
      setIsConverting(true);
      setStatus("Converting...");
      setProgress(0);
      setError(null);
      setAudioUrl(null);
      setTranscription(null);

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

  const downloadPrivateDriveVideo = async (apiKey: string) => {
    const match = videoUrl.match(/\/d\/([^/]+)\//);
    if (!match) {
      setError("Invalid Google Drive URL");
      return;
    }

    const fileId = match[1];
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;

    try {
      setIsDownloading(true);
      setError(null);
      const response = await fetch(downloadUrl);
      //   if (!response.ok) throw new Error("Failed to download video");

      const blob = await response.blob();
      setVideo(new File([blob], "downloaded_video.mp4", { type: blob.type }));
      setStatus("Video downloaded successfully");
    } catch (error) {
      console.error("Download Error:", error);
      setError("Failed to download video. Please check the URL and try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setStatus("Transcription copied to clipboard");
    setTimeout(() => {
      if (status === "Transcription copied to clipboard") {
        setStatus("");
      }
    }, 2000);
  };

  const downloadTranscription = () => {
    if (!transcription) return;

    const element = document.createElement("a");
    const file = new Blob([transcription], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${video?.name.replace(/\.[^/.]+$/, "")}_transcript.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
            Video to Podcast & Transcript
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Transform your videos into professional podcast episodes with full
            transcripts instantly. Perfect for content creators, educators, and
            businesses.
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <FileVideo className="w-4 h-4" />
                  Upload Video
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Video URL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload">
                <div
                  className={`flex items-center justify-center w-full ${
                    isDragging ? "border-purple-500" : "border-gray-300"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <label
                    htmlFor="video-file"
                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer bg-gray-50/50 hover:bg-gray-100/50 dark:bg-gray-800/50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-4 text-purple-500" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">
                          Click to upload your video
                        </span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Convert any video format into podcast-ready audio with
                        transcription
                      </p>
                    </div>
                    <Input
                      onChange={handleFileChange}
                      type="file"
                      accept="video/*"
                      id="video-file"
                      className="hidden"
                    />
                  </label>
                </div>
              </TabsContent>

              <TabsContent value="url">
                <div className="flex items-center gap-2">
                  <Input
                    type="url"
                    placeholder="Enter video URL (YouTube, Vimeo, Drive, etc.)"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      downloadPrivateDriveVideo(
                        "AIzaSyBPzfaigmE8lZnwah_N8eBFYX06Mm8RcCQ"
                      );
                    }}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      "Download"
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-4 flex items-center space-x-2">
              <Switch
                id="transcription"
                checked={enableTranscription}
                onCheckedChange={setEnableTranscription}
              />
              <Label
                htmlFor="transcription"
                className="flex items-center gap-2"
              >
                <span>Enable Transcription</span>
                <Badge variant="outline" className="ml-2 text-xs">
                  Powered by Whisper
                </Badge>
              </Label>
            </div>
          </CardContent>
        </Card>

        {video && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileVideo className="w-5 h-5 text-purple-500" />
                  <span className="font-medium">{video.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setVideo(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={() => setOpen(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  disabled={!video || isConverting}
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Podcast...
                    </>
                  ) : (
                    "Create Podcast Episode" +
                    (enableTranscription ? " & Transcript" : "")
                  )}
                </Button>

                {isConverting && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={cancelConversion}
                  >
                    Cancel Conversion
                  </Button>
                )}
              </div>

              {isConverting && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>Converting to audio...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-center text-muted-foreground">
                    {status}
                  </p>
                </div>
              )}

              {isTranscribing && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>Transcribing audio...</span>
                    <span>{Math.round(transcriptionProgress)}%</span>
                  </div>
                  <Progress value={transcriptionProgress} className="h-2" />
                  <p className="text-sm text-center text-muted-foreground">
                    Using Whisper Large V3 Turbo to transcribe your audio...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => setError(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        )}

        {status === "Conversion complete" && !error && (
          <Alert
            variant="default"
            className="mb-6 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
          >
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Your video has been successfully converted to audio
              {enableTranscription ? " and transcribed" : ""}.
            </AlertDescription>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => setStatus("")}
            >
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        )}

        {audioUrl && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold">
                  Your Podcast Episode is Ready!
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Preview your podcast episode below. You can download it and
                share it on any podcast platform.
              </p>
              <audio controls className="w-full">
                <source src={audioUrl} type="audio/mp3" />
                Your browser does not support the audio element.
              </audio>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = audioUrl;
                  link.download =
                    video?.name.replace(/\.[^/.]+$/, "") + "_podcast.mp3";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                Download Podcast Episode
              </Button>
            </CardContent>
          </Card>
        )}

        {transcription && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold">Transcript</h3>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => copyToClipboard(transcription)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={downloadTranscription}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download</span>
                  </Button>
                </div>
              </div>
              <Separator className="my-2" />
              <div className="mt-4 max-h-96 overflow-y-auto">
                <Textarea
                  value={transcription}
                  readOnly
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{"Download PDF"}</DialogTitle>
              <DialogDescription>
                {"Please enter your email to download the PDF."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={"your@email.com"}
                required
              />
              {emailError && (
                <p className="text-sm font-medium text-destructive mt-1">
                  {emailError}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={async () => {
                  const used = await isUsed(email, setEmailError);
                  if (!used) {
                    setEmailError("");
                    setOpen(false);
                    convertToAudio();
                  }
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={!video || isConverting}
              >
                {"Create Podcast Episode" +
                  (enableTranscription ? " & Transcript" : "")}
              </Button>

              {isConverting && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={cancelConversion}
                >
                  Cancel Conversion
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Page;
