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
  FileAudio,
  FileEdit,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/firebase/auth-context";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  trackTranscriptionUsage,
  trackArticleGenerationUsage,
} from "@/firebase/usage";
// Add these imports at the top with the other imports
import { checkUsageLimits } from "@/firebase/subscription";
// Add this import at the top with the other imports
import { formatTime, getFileSize } from "@/lib/helper";
import Features from "@/components/Features";
import Header from "@/components/Header";
import { getApiKey } from "@/firebase/firestore";

const Page = () => {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/signin");
    }
  }, [user, router]);

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
  const [enableArticleGeneration, setEnableArticleGeneration] = useState(false);
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);
  const [article, setArticle] = useState<string | null>(null);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [articleProgress, setArticleProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  const ffmpegRef = useRef<FFmpeg>(new FFmpeg());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Track elapsed time during conversion
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isConverting || isTranscribing || isGeneratingArticle) {
      if (!startTime) {
        setStartTime(Date.now());
      }

      interval = setInterval(() => {
        if (startTime) {
          setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }
      }, 1000);
    } else {
      setStartTime(null);
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConverting, isTranscribing, isGeneratingArticle, startTime]);

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
      setArticle(null);
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
      setArticle(null);
      setError(null);
    }
  };

  const cancelConversion = () => {
    abortControllerRef.current?.abort();
    setIsConverting(false);
    setIsTranscribing(false);
    setIsGeneratingArticle(false);
    setStatus("Conversion cancelled");
    setProgress(0);
    setTranscriptionProgress(0);
    setArticleProgress(0);
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    if (!audioBlob || !user) return;

    try {
      // Check subscription limits for transcription 
      const usageLimits = await checkUsageLimits(user.uid, "transcription");

      if (usageLimits.hasReachedLimit) {
        setError(
          `You've reached your monthly transcription limit (${usageLimits.limit} minutes). Please upgrade your plan to continue.`
        );
        return;
      }

      setIsTranscribing(true);
      setTranscriptionProgress(0);
      const startTranscriptionTime = Date.now();

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

      // Get API key from Firebase
      let apiKey =
        process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY || "hf_dummy_key";

      try {
        const savedApiKey = await getApiKey(user.uid);
        if (savedApiKey) {
          apiKey = savedApiKey;
        }
      } catch (error) {
        console.error("Error fetching API key:", error);
        // Continue with environment variable as fallback
      }

      // Make the API request to the Hugging Face Inference API
      const response = await fetch(
        "https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo",
        {
          method: 'POST',
          headers: {
            'Content-Type': 'audio/mpeg',
            Authorization: `Bearer ${apiKey}`,
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

      // Track transcription usage
      const transcriptionDuration =
        (Date.now() - startTranscriptionTime) / 1000;
      await trackTranscriptionUsage(user.uid, transcriptionDuration);

      // Generate article if enabled
      if (enableArticleGeneration) {
        await generateArticle(result.text);
      }
    } catch (error) {
      console.error("Transcription error:", error);
      setError(`Transcription failed: ${(error as Error).message}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const generateArticle = async (transcriptionText: string) => {
    if (!transcriptionText || !user) return;

    try {
      const usageLimits = await checkUsageLimits(user.uid, "article");

      if (usageLimits.hasReachedLimit) {
        setError(
          `You've reached your monthly article generation limit (${usageLimits.limit} articles). Please upgrade your plan to continue.`
        );
        return;
      }

      setIsGeneratingArticle(true);
      setArticleProgress(0);

      const progressInterval = setInterval(() => {
        setArticleProgress((prev) => {
          const newProgress = prev + Math.random() * 5;
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 1000);

      // Make API call to our backend
      const baseUrl = window.origin;
      const response = await fetch(`${baseUrl}/api/generate-article`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcriptionText: transcriptionText,
        }),
      });

      if (!response.ok) {
        throw new Error(`Article generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      setArticle(result.article);
      clearInterval(progressInterval);
      setArticleProgress(100);

      setArticle(result.content);
      await trackArticleGenerationUsage(user.uid);
    } catch (error) {
      console.error("Article generation error:", error);
      setError(`Article generation failed: ${(error as Error).message}`);
    } finally {
      setIsGeneratingArticle(false);
    }
  };

  // const generateArticle = async (transcriptionText: string) => {
  //   if (!transcriptionText || !user) return;

  //   try {
  //     // Check subscription limits for article generation
  //     const usageLimits = await checkUsageLimits(user.uid, "article");

  //     if (usageLimits.hasReachedLimit) {
  //       setError(
  //         `You've reached your monthly article generation limit (${usageLimits.limit} articles). Please upgrade your plan to continue.`
  //       );
  //       return;
  //     }

  //     setIsGeneratingArticle(true);
  //     setArticleProgress(0);

  //     // Simulate progress updates
  //     const progressInterval = setInterval(() => {
  //       setArticleProgress((prev) => {
  //         const newProgress = prev + Math.random() * 5;
  //         return newProgress > 95 ? 95 : newProgress;
  //       });
  //     }, 1000);

  //     // Get API key from Firebase
  //     let apiKey =
  //       process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY || "hf_dummy_key";

  //     try {
  //       const savedApiKey = await getApiKey(user.uid);
  //       if (savedApiKey) {
  //         apiKey = savedApiKey;
  //       }
  //     } catch (error) {
  //       console.error("Error fetching API key:", error);
  //       // Continue with environment variable as fallback
  //     }

  //     // Prepare the prompt for article generation
  //     const prompt = `
  //       You are a professional content writer. Based on the following transcript,
  //       create a well-structured article with headings, subheadings, and paragraphs.
  //       Make it engaging, informative, and easy to read. Add a compelling title at the top.

  //       Transcript: ${transcriptionText.substring(0, 4000)}
  //     `;

  //     // Make the API request to the Hugging Face Inference API
  //     const response = await fetch(
  //       "https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct",
  //       {
  //         method: "POST",
  //         headers: {
  //           Authorization: `Bearer ${apiKey}`,
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           inputs: `<s>[INST] ${prompt} [/INST]`,
  //           parameters: {
  //             max_new_tokens: 2000,
  //             temperature: 0.7,
  //             top_p: 0.9,
  //             do_sample: true,
  //           },
  //         }),
  //       }
  //     );

  //     clearInterval(progressInterval);
  //     setArticleProgress(100);

  //     if (!response.ok) {
  //       throw new Error(`Article generation failed: ${response.statusText}`);
  //     }

  //     const result = await response.json();
  //     // Extract the generated text after the prompt
  //     const generatedText = result.generated_text || "";
  //     // Remove the instruction part and keep only the response
  //     const articleText =
  //       generatedText.split("[/INST]").pop()?.trim() || generatedText;
  //     setArticle(articleText);

  //     // Track article generation usage
  //     await trackArticleGenerationUsage(user.uid);
  //   } catch (error) {
  //     console.error("Article generation error:", error);
  //     setError(`Article generation failed: ${(error as Error).message}`);
  //   } finally {
  //     setIsGeneratingArticle(false);
  //   }
  // };

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
    setStatus("Copied to clipboard");
    setTimeout(() => {
      if (status === "Copied to clipboard") {
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

  const downloadArticle = () => {
    if (!article) return;

    const element = document.createElement("a");
    const file = new Blob([article], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${video?.name.replace(/\.[^/.]+$/, "")}_article.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Get current stage for display
  const getCurrentStage = () => {
    if (isGeneratingArticle) return "Generating Article";
    if (isTranscribing) return "Transcribing";
    if (isConverting) return "Converting";
    if (audioUrl) return "Complete";
    return "Ready";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Header Section */}
        <Header />

        {/* Main Content */}
        <Card className="shadow-lg border-0 overflow-hidden mb-6">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              {/* Features Sidebar */}
              <Features />

              {/* Upload Area */}
              <div className="col-span-2 p-6 md:p-8">
                {!video ? (
                  <Card className="mb-8 shadow-none border-0">
                    <CardContent className="pt-6">
                      <Tabs defaultValue="upload" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                          <TabsTrigger
                            value="upload"
                            className="flex items-center gap-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800"
                          >
                            <FileVideo className="w-4 h-4" />
                            Upload Video
                          </TabsTrigger>
                          <TabsTrigger
                            value="url"
                            className="flex items-center gap-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800"
                          >
                            <LinkIcon className="w-4 h-4" />
                            Video URL
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="upload">
                          <div
                            className={`flex items-center justify-center w-full ${
                              isDragging
                                ? "border-purple-500"
                                : "border-gray-300"
                            }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                          >
                            <label
                              htmlFor="video-file"
                              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer bg-purple-50/50 hover:bg-purple-100/50 transition-colors"
                            >
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-10 h-10 mb-4 text-purple-500" />
                                <p className="mb-2 text-sm text-gray-600">
                                  <span className="font-semibold">
                                    Click to upload your video
                                  </span>{" "}
                                  or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">
                                  Convert any video format into podcast-ready
                                  audio with transcription
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
                              placeholder="Enter video URL (Drive only)"
                              value={videoUrl}
                              onChange={(e) => setVideoUrl(e.target.value)}
                              className="flex-1 border-purple-200 focus:border-purple-400"
                            />
                            <Button
                              variant="secondary"
                              onClick={() => {
                                downloadPrivateDriveVideo(
                                  "AIzaSyBPzfaigmE8lZnwah_N8eBFYX06Mm8RcCQ"
                                );
                              }}
                              disabled={isDownloading}
                              className="bg-purple-100 text-purple-700 hover:bg-purple-200"
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

                      <div className="mt-6 space-y-3">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="transcription"
                            checked={enableTranscription}
                            onCheckedChange={(checked) => {
                              setEnableTranscription(checked);
                              if (!checked) {
                                setEnableArticleGeneration(false);
                              }
                            }}
                          />
                          <Label
                            htmlFor="transcription"
                            className="flex items-center gap-2"
                          >
                            <span>Enable Transcription</span>
                            <Badge
                              variant="outline"
                              className="ml-2 text-xs text-purple-600 bg-purple-50 border-purple-200"
                            >
                              Powered by Whisper
                            </Badge>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="article"
                            checked={enableArticleGeneration}
                            onCheckedChange={setEnableArticleGeneration}
                            disabled={!enableTranscription}
                          />
                          <Label
                            htmlFor="article"
                            className="flex items-center gap-2"
                          >
                            <span>Generate Article from Transcript</span>
                            <Badge
                              variant="outline"
                              className="ml-2 text-xs text-purple-600 bg-purple-50 border-purple-200"
                            >
                              AI-Powered
                            </Badge>
                          </Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="mb-8 overflow-hidden border-0 shadow-lg">
                      {/* Header with gradient background */}
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium flex items-center">
                            <FileVideo className="w-5 h-5 mr-2" />
                            Selected Video
                          </h3>
                          <Badge
                            variant="outline"
                            className="bg-white/20 text-white border-white/30 backdrop-blur-sm"
                          >
                            {getCurrentStage()}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-6">
                        {/* File details */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3">
                              <div className="bg-purple-100 p-2 rounded-lg">
                                <FileVideo className="w-6 h-6 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className="font-medium text-gray-900 truncate"
                                  title={video.name}
                                >
                                  {video.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-normal text-gray-500"
                                  >
                                    {getFileSize(video)}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-normal text-gray-500"
                                  >
                                    {video.type.split("/")[1].toUpperCase()}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setVideo(null)}
                            className="shrink-0 border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                            disabled={
                              isConverting ||
                              isTranscribing ||
                              isGeneratingArticle
                            }
                          >
                            <X className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>

                        {/* Output preview */}
                        {!isConverting &&
                          !isTranscribing &&
                          !isGeneratingArticle &&
                          !audioUrl && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                              <div className="bg-purple-50 rounded-lg p-4 flex items-center">
                                <div className="bg-white p-2 rounded-full shadow-sm mr-3">
                                  <FileAudio className="h-5 w-5 text-purple-500" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-purple-900 text-sm">
                                    MP3 Podcast
                                  </h4>
                                  <p className="text-xs text-gray-600">
                                    High-quality audio format
                                  </p>
                                </div>
                              </div>

                              {enableTranscription && (
                                <div className="bg-purple-50 rounded-lg p-4 flex items-center">
                                  <div className="bg-white p-2 rounded-full shadow-sm mr-3">
                                    <FileText className="h-5 w-5 text-purple-500" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-purple-900 text-sm">
                                      Transcript
                                    </h4>
                                    <p className="text-xs text-gray-600">
                                      Full text transcription
                                    </p>
                                  </div>
                                </div>
                              )}

                              {enableArticleGeneration && (
                                <div className="bg-purple-50 rounded-lg p-4 flex items-center">
                                  <div className="bg-white p-2 rounded-full shadow-sm mr-3">
                                    <FileEdit className="h-5 w-5 text-purple-500" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-purple-900 text-sm">
                                      Article
                                    </h4>
                                    <p className="text-xs text-gray-600">
                                      AI-generated blog post
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                        {/* Conversion progress */}
                        <AnimatePresence mode="wait">
                          {isConverting && (
                            <motion.div
                              key="converting"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="mb-6"
                            >
                              <div className="flex justify-between items-center text-sm mb-2">
                                <div className="flex items-center text-purple-700">
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  <span className="font-medium">
                                    Converting to audio
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">
                                    {formatTime(elapsedTime)}
                                  </span>
                                  <span className="font-medium text-purple-700">
                                    {progress}%
                                  </span>
                                </div>
                              </div>
                              <div className="relative">
                                <Progress
                                  value={progress}
                                  className="h-2 bg-purple-100"
                                />
                                <div className="absolute -bottom-6 left-0 right-0">
                                  <p className="text-xs text-center text-gray-500 animate-pulse">
                                    {status || "Processing your video..."}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {isTranscribing && (
                            <motion.div
                              key="transcribing"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="mb-6"
                            >
                              <div className="flex justify-between items-center text-sm mb-2">
                                <div className="flex items-center text-purple-700">
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  <span className="font-medium">
                                    Transcribing audio
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">
                                    {formatTime(elapsedTime)}
                                  </span>
                                  <span className="font-medium text-purple-700">
                                    {Math.round(transcriptionProgress)}%
                                  </span>
                                </div>
                              </div>
                              <div className="relative">
                                <Progress
                                  value={transcriptionProgress}
                                  className="h-2 bg-purple-100"
                                />
                                <div className="absolute -bottom-6 left-0 right-0">
                                  <p className="text-xs text-center text-gray-500">
                                    <span className="inline-flex items-center">
                                      <span className="relative flex h-2 w-2 mr-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                                      </span>
                                      Using Whisper Large V3 Turbo to transcribe
                                      your audio...
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {isGeneratingArticle && (
                            <motion.div
                              key="generating-article"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="mb-6"
                            >
                              <div className="flex justify-between items-center text-sm mb-2">
                                <div className="flex items-center text-purple-700">
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  <span className="font-medium">
                                    Generating article
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">
                                    {formatTime(elapsedTime)}
                                  </span>
                                  <span className="font-medium text-purple-700">
                                    {Math.round(articleProgress)}%
                                  </span>
                                </div>
                              </div>
                              <div className="relative">
                                <Progress
                                  value={articleProgress}
                                  className="h-2 bg-purple-100"
                                />
                                <div className="absolute -bottom-6 left-0 right-0">
                                  <p className="text-xs text-center text-gray-500">
                                    <span className="inline-flex items-center">
                                      <span className="relative flex h-2 w-2 mr-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                                      </span>
                                      Creating a well-structured article from
                                      your transcript...
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Action buttons */}
                        <div className="space-y-3 mt-8">
                          <Button
                            onClick={convertToAudio}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg transition-all"
                            size="lg"
                            disabled={
                              isConverting ||
                              isTranscribing ||
                              isGeneratingArticle
                            }
                          >
                            {isConverting ||
                            isTranscribing ||
                            isGeneratingArticle ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <span className="mr-2">
                                  Create Podcast Episode
                                  {enableTranscription ? " & Transcript" : ""}
                                  {enableArticleGeneration ? " & Article" : ""}
                                </span>
                                <span className="bg-white/20 text-xs py-0.5 px-2 rounded-full">
                                  AI-Powered
                                </span>
                              </>
                            )}
                          </Button>

                          {(isConverting ||
                            isTranscribing ||
                            isGeneratingArticle) && (
                            <Button
                              variant="outline"
                              className="w-full border-gray-200 hover:bg-gray-100 text-gray-700"
                              onClick={cancelConversion}
                            >
                              <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                              Cancel Processing
                            </Button>
                          )}
                        </div>

                        {/* Tips */}
                        {!isConverting &&
                          !isTranscribing &&
                          !isGeneratingArticle &&
                          !audioUrl && (
                            <div className="mt-6 bg-blue-50 rounded-lg p-3 text-xs text-blue-700 flex items-start">
                              <div className="bg-blue-100 p-1 rounded-full mr-2 mt-0.5">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="12" y1="16" x2="12" y2="12"></line>
                                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                              </div>
                              <div>
                                <span className="font-medium">Pro tip:</span>{" "}
                                For best results, ensure your video has clear
                                audio. The conversion process may take a few
                                minutes depending on the file size.
                              </div>
                            </div>
                          )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                <div className="border-t border-gray-200 pt-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium text-purple-900">
                        Output Options
                      </h3>
                      <p className="text-sm text-gray-500">
                        Customize your podcast and transcript
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-purple-50 rounded-lg p-4 flex items-center">
                      <div className="bg-white p-2 rounded-full shadow-sm mr-3">
                        <FileAudio className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-purple-900 text-sm">
                          MP3 Podcast
                        </h4>
                        <p className="text-xs text-gray-600">
                          High-quality audio format
                        </p>
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 flex items-center">
                      <div className="bg-white p-2 rounded-full shadow-sm mr-3">
                        <FileText className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-purple-900 text-sm">
                          Transcript
                        </h4>
                        <p className="text-xs text-gray-600">
                          Full text transcription
                        </p>
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 flex items-center">
                      <div className="bg-white p-2 rounded-full shadow-sm mr-3">
                        <FileEdit className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-purple-900 text-sm">
                          Article
                        </h4>
                        <p className="text-xs text-gray-600">
                          AI-generated blog post
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
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

        {/* Success Alert */}
        {status === "Conversion complete" && !error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <Alert className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30">
              {/* Success icon with animated circle */}
              <div className="relative mr-4">
                <div className="absolute inset-0 rounded-full bg-green-100 dark:bg-green-800/30 animate-ping opacity-50"></div>
                <div className="relative">
                  <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <AlertTitle className="text-green-800 dark:text-green-300 font-medium text-base mb-1">
                  Conversion Complete
                </AlertTitle>
                <AlertDescription className="text-green-700/80 dark:text-green-300/80">
                  Your video has been successfully converted to audio
                  {enableTranscription ? " and transcribed" : ""}
                  {enableArticleGeneration && article
                    ? " with an article generated"
                    : ""}
                  . Your files are ready to download.
                </AlertDescription>

                {/* Action buttons */}
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white border-0 shadow-sm"
                    onClick={() => {
                      if (audioUrl) {
                        const link = document.createElement("a");
                        link.href = audioUrl;
                        link.download =
                          video?.name.replace(/\.[^/.]+$/, "") + "_podcast.mp3";
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                    }}
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Download Audio
                  </Button>
                </div>
              </div>

              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 rounded-full hover:bg-green-200/50 dark:hover:bg-green-800/30 text-green-700 dark:text-green-400"
                onClick={() => setStatus("")}
                aria-label="Close alert"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </Alert>
          </motion.div>
        )}

        {/* Audio Player */}
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
                <Download className="h-4 w-4 mr-2" />
                Download Podcast Episode
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Transcript */}
        {transcription && (
          <Card className="mb-6">
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

        {/* Article */}
        {article && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileEdit className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold">Generated Article</h3>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => copyToClipboard(article)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={downloadArticle}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download</span>
                  </Button>
                </div>
              </div>
              <Separator className="my-2" />
              <div className="mt-4 max-h-96 overflow-y-auto">
                <div className="prose prose-sm max-w-none">
                  {article.split("\n").map((paragraph, index) => {
                    if (paragraph.startsWith("# ")) {
                      return (
                        <h1
                          key={index}
                          className="text-2xl font-bold mt-4 mb-2"
                        >
                          {paragraph.substring(2)}
                        </h1>
                      );
                    } else if (paragraph.startsWith("## ")) {
                      return (
                        <h2 key={index} className="text-xl font-bold mt-4 mb-2">
                          {paragraph.substring(3)}
                        </h2>
                      );
                    } else if (paragraph.startsWith("### ")) {
                      return (
                        <h3 key={index} className="text-lg font-bold mt-3 mb-2">
                          {paragraph.substring(4)}
                        </h3>
                      );
                    } else if (paragraph.trim() === "") {
                      return <br key={index} />;
                    } else {
                      return (
                        <p key={index} className="mb-2">
                          {paragraph}
                        </p>
                      );
                    }
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Page;
