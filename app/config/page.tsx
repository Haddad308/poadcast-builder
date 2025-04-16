"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Settings, CheckCircle, AlertCircle, Loader2, ArrowLeft, Key, Shield, CreditCard, Infinity } from "lucide-react"
import { useAuth } from "@/firebase/auth-context"
import { Label } from "@/components/ui/label"
import { saveApiKey, getApiKey } from "@/firebase/firestore"
import { getUserUsageStats } from "@/firebase/usage"
import { Separator } from "@/components/ui/separator"
import { getUserSubscription } from "@/firebase/subscription"

export default function ConfigPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [apiKey, setApiKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [usageStats, setUsageStats] = useState<{
    currentMonthStats: {
      transcriptionCost: number;
      transcriptionMinutes: number;
      articleCost: number;
      articleCount: number;
      totalCost: number;
    };
    totalStats: {
      transcriptionCost: number;
      articleCost: number;
      totalCost: number;
      lastUpdated: { toDate: () => Date } | null;
    };
  } | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [subscription, setSubscription] = useState<{
    isLifetime: boolean;
    status: string;
    startDate: string;
  } | null>(null)

  const fetchUsageStats = async () => {
    if (!user) return

    try {
      setIsLoadingStats(true)
      const stats = await getUserUsageStats(user.uid)
      setUsageStats(stats)
    } catch (error) {
      console.error("Error fetching usage stats:", error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  useEffect(() => {
    if (!user) {
      router.push("/signin")
      return
    }

    // Load API key from Firebase
    const fetchApiKey = async () => {
      try {
        setIsFetching(true)
        const savedApiKey = await getApiKey(user.uid)
        if (savedApiKey) {
          setApiKey(savedApiKey)
        }
      } catch (error) {
        console.error("Error fetching API key:", error)
      } finally {
        setIsFetching(false)
      }
    }

    fetchApiKey()
    fetchUsageStats()

    // Load subscription data
    const fetchSubscription = async () => {
      try {
        const subscriptionData = await getUserSubscription(user.uid)
        if (subscriptionData) {
          setSubscription({
            isLifetime: subscriptionData.isLifetime || false,
            status: subscriptionData.status || 'inactive',
            startDate: subscriptionData.startDate || new Date().toISOString()
          })
        }
      } catch (error) {
        console.error("Error fetching subscription:", error)
      }
    }

    fetchSubscription()
  }, [user, router])

  const validateApiKey = (key: string) => {
    // Basic validation - Hugging Face API keys typically start with "hf_" and are longer than 10 chars
    return key.startsWith("hf_") && key.length > 10
  }

  const testApiKey = async () => {
    if (!validateApiKey(apiKey)) {
      setErrorMessage("Invalid API key format. Hugging Face API keys typically start with 'hf_'")
      setTestStatus("error")
      return
    }

    setTestStatus("loading")
    setErrorMessage("")

    try {
      // Test the API key by making a simple request to the Hugging Face API
      const response = await fetch("https://api-inference.huggingface.co/models/openai/whisper-large-v3-turbo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: "Test" }),
      })

      if (response.ok || response.status === 400) {
        // 400 is acceptable here as it means the API key is valid but the request format is wrong
        setTestStatus("success")
      } else {
        throw new Error(`API test failed with status: ${response.status}`)
      }
    } catch (error) {
      console.error("API key test failed:", error)
      setErrorMessage(`Failed to validate API key: ${(error as Error).message}`)
      setTestStatus("error")
    }
  }

  const saveApiKeyToFirebase = async () => {
    if (!user) {
      setErrorMessage("You must be logged in to save settings")
      setTestStatus("error")
      return
    }

    if (!validateApiKey(apiKey)) {
      setErrorMessage("Invalid API key format. Hugging Face API keys typically start with 'hf_'")
      setTestStatus("error")
      return
    }

    setIsLoading(true)
    setErrorMessage("")

    try {
      await saveApiKey(user.uid, apiKey)
      setTestStatus("success")

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/")
      }, 1000)
    } catch (error) {
      console.error("Error saving API key:", error)
      setErrorMessage(`Failed to save API key: ${(error as Error).message}`)
      setTestStatus("error")
    } finally {
      setIsLoading(false)
    }
  }

  const hasLifetimeAccess = subscription?.isLifetime && subscription?.status === "active"

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuration</h1>
          <p className="text-gray-600">Manage your API keys and application settings</p>
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
                <span className="ml-3 text-gray-600">Loading your settings...</span>
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
                      setApiKey(e.target.value)
                      setTestStatus("idle")
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
                    <AlertDescription>Your API key has been validated successfully.</AlertDescription>
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
          <CardFooter className="bg-gray-50 border-t border-gray-100 flex justify-between">
            <div className="text-sm text-gray-500 flex items-center">
              <Shield className="h-4 w-4 mr-2 text-purple-500" />
              Your API key is securely stored and encrypted in our database.
            </div>
          </CardFooter>
        </Card>

        {/* Usage Statistics Card */}
        <Card className="shadow-lg border-0 mt-6">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
            <CardTitle className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M12 20V10"></path>
                <path d="M18 20V4"></path>
                <path d="M6 20v-4"></path>
              </svg>
              Usage Statistics
            </CardTitle>
            <CardDescription className="text-white/80">
              Track your AI service usage and associated costs
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoadingStats ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-3 text-gray-600">Loading your usage statistics...</span>
              </div>
            ) : usageStats ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Current Month Usage</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-blue-600 font-medium">Transcription</div>
                      <div className="mt-1 text-2xl font-bold">
                        ${usageStats.currentMonthStats.transcriptionCost.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {usageStats.currentMonthStats.transcriptionMinutes.toFixed(1)} minutes processed
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-purple-600 font-medium">Article Generation</div>
                      <div className="mt-1 text-2xl font-bold">
                        ${usageStats.currentMonthStats.articleCost.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {usageStats.currentMonthStats.articleCount} articles generated
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-green-600 font-medium">Total</div>
                      <div className="mt-1 text-2xl font-bold">
                        ${usageStats.currentMonthStats.totalCost.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">This month&apos;s combined usage</div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-3">All-Time Usage</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-blue-600 font-medium">Transcription</div>
                      <div className="mt-1 text-2xl font-bold">
                        ${usageStats.totalStats.transcriptionCost.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-purple-600 font-medium">Article Generation</div>
                      <div className="mt-1 text-2xl font-bold">${usageStats.totalStats.articleCost.toFixed(2)}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-green-600 font-medium">Total</div>
                      <div className="mt-1 text-2xl font-bold">${usageStats.totalStats.totalCost.toFixed(2)}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Last updated:{" "}
                        {usageStats.totalStats.lastUpdated
                          ? new Date(usageStats.totalStats.lastUpdated.toDate()).toLocaleString()
                          : "Never"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-1 rounded-full mr-2 mt-0.5">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-medium">Note:</span> These costs are estimates based on standard pricing for
                      AI services. Actual billing may vary based on your Hugging Face account plan and usage.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="mb-2">No usage data available yet</div>
                <div className="text-sm">
                  Start using transcription and article generation to see your usage statistics
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Status Card */}
        <Card className="shadow-lg border-0 mt-6">
          <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Access Status
            </CardTitle>
            <CardDescription className="text-white/80">Your current plan and usage limits</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                <span className="ml-3 text-gray-600">Loading your access details...</span>
              </div>
            ) : hasLifetimeAccess ? (
              <div className="space-y-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-green-800 flex items-center">
                        <Infinity className="h-5 w-5 mr-2 text-green-600" />
                        Lifetime Access
                      </h3>
                      <p className="text-sm text-gray-600">
                        Status: <span className="font-medium text-green-600">Active</span>
                      </p>
                    </div>
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>

                  <div className="mt-4 bg-white rounded-lg p-3 shadow-sm">
                    <div className="text-center">
                      <div className="text-lg font-medium text-green-700">Unlimited Usage</div>
                      <div className="text-sm text-gray-600 mt-1">
                        You have unlimited access to all features with no restrictions
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-gray-600">
                    Purchase date: {new Date(subscription.startDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-1 rounded-full mr-2 mt-0.5">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-medium">Thank you for your purchase!</span> You have lifetime access to all
                      features including unlimited transcription and article generation.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Free Access</h3>
                  <p className="text-sm text-gray-600 mb-4">You&apos;re currently on the free plan with limited features.</p>
                  <Button className="bg-green-600 hover:bg-green-700" onClick={() => router.push("/pricing")}>
                    Get Lifetime Access
                  </Button>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
                  <div className="flex items-start">
                    <div className="bg-blue-100 p-1 rounded-full mr-2 mt-0.5">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-medium">Free Plan Limits:</span> 5 minutes of transcription and 1 article
                      generation per month. Upgrade to lifetime access for unlimited features.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
          <div className="flex items-start">
            <div className="bg-blue-100 p-1 rounded-full mr-2 mt-0.5">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div>
              <span className="font-medium">Important:</span> The Hugging Face API key is required for transcription
              services. Without a valid API key, you can still convert videos to audio, but transcription will not be
              available.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
