import { useAuth } from "@/firebase/auth-context";
import { getApiKey } from "@/firebase/firestore";
import { checkUsageLimits } from "@/firebase/subscription";
import { trackTranscriptionUsage } from "@/firebase/usage";
import { useState } from "react";

const useTranscription = ({
  setError,
  videoName,
  enableArticleGeneration,
}: {
  setError: (error: string) => void;
  videoName: File | null;
  enableArticleGeneration: boolean;
}) => {
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const { user } = useAuth();

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
          method: "POST",
          headers: {
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
        //     await generateArticle(result.text);
      }
    } catch (error) {
      console.error("Transcription error:", error);
      setError(`Transcription failed: ${(error as Error).message}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const downloadTranscription = () => {
    if (!transcription) return;

    const element = document.createElement("a");
    const file = new Blob([transcription], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${videoName?.name.replace(
      /\.[^/.]+$/,
      ""
    )}_transcript.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return {
    transcribeAudio,
    transcription,
    isTranscribing,
    setTranscription,
    setIsTranscribing,
    transcriptionProgress,
    setTranscriptionProgress,
    downloadTranscription,
  };
};
export default useTranscription;
