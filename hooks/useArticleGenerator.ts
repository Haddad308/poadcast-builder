import { useAuth } from "@/firebase/auth-context";
import { getApiKey } from "@/firebase/firestore";
import { checkUsageLimits } from "@/firebase/subscription";
import { trackArticleGenerationUsage } from "@/firebase/usage";
import { useState } from "react";

const useArticleGenerator = ({
  setError,
}: {
  setError: (error: string) => void;
}) => {
  const { user } = useAuth();

  const [article, setArticle] = useState<string | null>(null);
  const [articleProgress, setArticleProgress] = useState(0);
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);

  const generateArticle = async (transcriptionText: string) => {
    if (!transcriptionText || !user) return;

    try {
      // Check subscription limits for article generation
      const usageLimits = await checkUsageLimits(user.uid, "article");

      if (usageLimits.hasReachedLimit) {
        setError(
          `You've reached your monthly article generation limit (${usageLimits.limit} articles). Please upgrade your plan to continue.`
        );
        return;
      }

      setIsGeneratingArticle(true);
      setArticleProgress(0);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setArticleProgress((prev) => {
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

      // Prepare the prompt for article generation
      const prompt = `
          You are a professional content writer. Based on the following transcript, 
          create a well-structured article with headings, subheadings, and paragraphs.
          Make it engaging, informative, and easy to read. Add a compelling title at the top.
          
          Transcript: ${transcriptionText.substring(0, 4000)}
        `;

      // Make the API request to the Hugging Face Inference API
      const response = await fetch(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: `<s>[INST] ${prompt} [/INST]`,
            parameters: {
              max_new_tokens: 2000,
              temperature: 0.7,
              top_p: 0.9,
              do_sample: true,
            },
          }),
        }
      );

      clearInterval(progressInterval);
      setArticleProgress(100);

      if (!response.ok) {
        throw new Error(`Article generation failed: ${response.statusText}`);
      }

      const result = await response.json();
      // Extract the generated text after the prompt
      const generatedText = result.generated_text || "";
      // Remove the instruction part and keep only the response
      const articleText =
        generatedText.split("[/INST]").pop()?.trim() || generatedText;
      setArticle(articleText);

      // Track article generation usage
      await trackArticleGenerationUsage(user.uid);
    } catch (error) {
      console.error("Article generation error:", error);
      setError(`Article generation failed: ${(error as Error).message}`);
    } finally {
      setIsGeneratingArticle(false);
    }
  };

  return {
    generateArticle,
    article,
    setArticle,
    articleProgress,
    setArticleProgress,
    isGeneratingArticle,
    setIsGeneratingArticle,
  };
};
export default useArticleGenerator;
