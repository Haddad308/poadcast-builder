"use client";

import { useState, useEffect } from "react";
import {
  FileVideo,
  X,
  Loader2,
  FileAudio,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface VideoConversionCardProps {
  video: File;
  onRemove: () => void;
  onConvert: () => void;
  onCancel: () => void;
  isConverting: boolean;
  isTranscribing: boolean;
  progress: number;
  transcriptionProgress: number;
  status: string;
  enableTranscription: boolean;
}

export function VideoConversionCard({
  video,
  onRemove,
  onConvert,
  onCancel,
  isConverting,
  isTranscribing,
  progress,
  transcriptionProgress,
  status,
  enableTranscription,
}: VideoConversionCardProps) {
  const [fileSize, setFileSize] = useState<string>("");
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Format file size
  useEffect(() => {
    if (video) {
      const size = video.size;
      if (size < 1024 * 1024) {
        setFileSize(`${(size / 1024).toFixed(2)} KB`);
      } else {
        setFileSize(`${(size / (1024 * 1024)).toFixed(2)} MB`);
      }
    }
  }, [video]);

  // Track elapsed time during conversion
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isConverting || isTranscribing) {
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
  }, [isConverting, isTranscribing, startTime]);

  // Format elapsed time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Determine if we're in the final stage of processing
  const isProcessing = isConverting || isTranscribing;

  // Get the current stage for display
  const getCurrentStage = () => {
    if (isTranscribing) return "Transcribing";
    if (isConverting) return "Converting";
    return "Ready";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-6 overflow-hidden border-0 shadow-lg">
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
                      {fileSize}
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
              onClick={onRemove}
              className="shrink-0 border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              disabled={isProcessing}
            >
              <X className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>

          {/* Output preview */}
          {!isProcessing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-purple-50 rounded-lg p-4 flex items-center">
                <div className="bg-white p-2 rounded-full shadow-sm mr-3">
                  <FileAudio className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h4 className="font-medium text-purple-900 text-sm">
                    MP3 Audio
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
                      SRT, TXT, and PDF formats
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
                    <span className="font-medium">Converting to audio</span>
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
                  <Progress value={progress} className="h-2 bg-purple-100" />
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
                    <span className="font-medium">Transcribing audio</span>
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
                        Using Whisper Large V3 Turbo to transcribe your audio...
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
              onClick={onConvert}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg transition-all"
              size="lg"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <span className="mr-2">
                    Create Audio Episode
                    {enableTranscription ? " & Transcript" : ""}
                  </span>
                  <span className="bg-white/20 text-xs py-0.5 px-2 rounded-full">
                    AI-Powered
                  </span>
                </>
              )}
            </Button>

            {isProcessing && (
              <Button
                variant="outline"
                className="w-full border-gray-200 hover:bg-gray-100 text-gray-700"
                onClick={onCancel}
              >
                <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                Cancel Processing
              </Button>
            )}
          </div>

          {/* Tips */}
          {!isProcessing && (
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
                <span className="font-medium">Pro tip:</span> For best results,
                ensure your video has clear audio. The conversion process may
                take a few minutes depending on the file size.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
