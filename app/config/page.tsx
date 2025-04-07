"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Key,
  Shield,
} from "lucide-react";
import { useAuth } from "@/firebase/auth-context";
import { Label } from "@/components/ui/label";
import { getApiKey, saveApiKey } from "@/firebase/firestore";

export default function ConfigPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [testStatus, setTestStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/signin");
      return;
    }

    // Load API key from Firebase
    const fetchApiKey = async () => {
      try {
        setIsFetching(true);
        const savedApiKey = await getApiKey(user.uid);
        if (savedApiKey) {
          setApiKey(savedApiKey);
        }
      } catch (error) {
        console.error("Error fetching API key:", error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchApiKey();
  }, [user, router]);

  const validateApiKey = (key: string) => {
    // Basic validation - Hugging Face API keys typically start with "hf_" and are longer than 10 chars
    return key.startsWith("hf_") && key.length > 10;
  };

  const testApiKey = async () => {
    if (!validateApiKey(apiKey)) {
      setErrorMessage(
        "Invalid API key format. Hugging Face API keys typically start with 'hf_'"
      );
      setTestStatus("error");
      return;
    }

    setTestStatus("loading");
    setErrorMessage("");

    try {
      // Test the API key by making a simple request to the Hugging Face API
      const response = await fetch(
        "https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: "Test" }),
        }
      );

      if (response.ok || response.status === 400) {
        // 400 is acceptable here as it means the API key is valid but the request format is wrong
        setTestStatus("success");
      } else {
        throw new Error(`API test failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error("API key test failed:", error);
      setErrorMessage(
        `Wrong API key. Please check your API key and try again.`
      );
      setTestStatus("error");
    }
  };

  const saveApiKeyToFirebase = async () => {
    if (!user) {
      setErrorMessage("You must be logged in to save settings");
      setTestStatus("error");
      return;
    }

    if (!validateApiKey(apiKey)) {
      setErrorMessage(
        "Invalid API key format. Hugging Face API keys typically start with 'hf_'"
      );
      setTestStatus("error");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      await saveApiKey(user.uid, apiKey);
      setTestStatus("success");

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (error) {
      console.error("Error saving API key:", error);
      setErrorMessage(`Failed to save API key: ${(error as Error).message}`);
      setTestStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Button
          variant="ghost"
          className="mb-6 text-purple-600 hover:text-purple-800 hover:bg-purple-100"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="text-center mb-8">
          <div className="inline-block mb-4 bg-purple-100 p-3 rounded-full">
            <Settings className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configuration
          </h1>
          <p className="text-gray-600">
            Manage your API keys and application settings
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardTitle className="flex items-center">
              <Key className="mr-2 h-5 w-5" />
              Hugging Face API Key
            </CardTitle>
            <CardDescription className="text-white/80">
              Configure your Hugging Face API key for transcription services
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isFetching ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <span className="ml-3 text-gray-600">
                  Loading your settings...
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Enter your Hugging Face API key (hf_...)"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setTestStatus("idle");
                    }}
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500">
                    You can get your API key from the{" "}
                    <a
                      href="https://huggingface.co/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline"
                    >
                      Hugging Face settings page
                    </a>
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={testApiKey}
                    disabled={testStatus === "loading" || !apiKey}
                    className="flex-1"
                  >
                    {testStatus === "loading" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      "Test API Key"
                    )}
                  </Button>
                  <Button
                    onClick={saveApiKeyToFirebase}
                    disabled={testStatus !== "success" || isLoading}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save & Return"
                    )}
                  </Button>
                </div>

                {testStatus === "success" && (
                  <Alert className="bg-green-50 border-green-200 text-green-800">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>
                      Your API key has been validated successfully.
                    </AlertDescription>
                  </Alert>
                )}

                {testStatus === "error" && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-gray-50 border-t border-gray-100 flex justify-center items-center p-2">
            <div className="text-sm text-gray-500 flex items-center">
              <Shield className="h-4 w-4 mr-2 text-purple-500" />
              Your API key is securely stored and encrypted in our database.
            </div>
          </CardFooter>
        </Card>

        <div className="mt-8 bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
          <div className="flex items-start">
            <div className="bg-blue-100 p-1 rounded-full mr-2 mt-0.5">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div>
              <span className="font-medium">Important:</span> The Hugging Face
              API key is required for transcription services. Without a valid
              API key, you can still convert videos to audio, but transcription
              will not be available.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
