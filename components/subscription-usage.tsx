"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { AlertCircle, CreditCard, Loader2, Infinity } from "lucide-react"
import { useRouter } from "next/navigation"
import { checkUsageLimits, getUserSubscription } from "@/firebase/subscription"

interface SubscriptionUsageProps {
  userId: string
}

export function SubscriptionUsage({ userId }: SubscriptionUsageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  interface SubscriptionData {
    isLifetime: boolean
    status: string
  }

  interface UsageData {
    used: number
    limit: number
    hasReachedLimit: boolean
  }

  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [transcriptionUsage, setTranscriptionUsage] = useState<UsageData | null>(null)
  const [articleUsage, setArticleUsage] = useState<UsageData | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return

      try {
        setIsLoading(true)

        // Fetch subscription data
        const subscriptionData = await getUserSubscription(userId)
        setSubscription({
          isLifetime: subscriptionData?.isLifetime ?? false,
          status: subscriptionData?.status ?? ''
        })

        // Fetch usage data
        const transcriptionLimits = await checkUsageLimits(userId, "transcription")
        const articleLimits = await checkUsageLimits(userId, "article")

        setTranscriptionUsage(transcriptionLimits)
        setArticleUsage(articleLimits)
      } catch (error) {
        console.error("Error fetching subscription data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [userId])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-purple-500 mr-2" />
        <span className="text-sm text-gray-600">Loading subscription data...</span>
      </div>
    )
  }

  const hasLifetimeAccess = subscription?.isLifetime && subscription?.status === "active"

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center">
          <CreditCard className="h-4 w-4 mr-2 text-purple-500" />
          {hasLifetimeAccess ? "Lifetime Access" : "Free Plan"}
        </CardTitle>
        <CardDescription className="text-xs">
          {hasLifetimeAccess ? "Unlimited access to all features" : "Limited access - Upgrade for unlimited features"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {hasLifetimeAccess ? (
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="flex justify-center items-center mb-1">
                <Infinity className="h-5 w-5 text-purple-600 mr-1" />
                <span className="font-medium text-purple-800">Unlimited Access</span>
              </div>
              <p className="text-xs text-purple-600">You have unlimited transcription and article generation</p>
            </div>
          ) : (
            <>
              {transcriptionUsage && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Transcription</span>
                    <span className="font-medium">
                      {transcriptionUsage.used.toFixed(1)} / {transcriptionUsage.limit} min
                    </span>
                  </div>
                  <Progress
                    value={(transcriptionUsage.used / transcriptionUsage.limit) * 100}
                    className="h-1.5"
                   
                  />
                </div>
              )}

              {articleUsage && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Articles</span>
                    <span className="font-medium">
                      {articleUsage.used} / {articleUsage.limit}
                    </span>
                  </div>
                  <Progress
                    value={(articleUsage.used / articleUsage.limit) * 100}
                    className="h-1.5"
                    
                  />
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 text-xs h-8"
                onClick={() => router.push("/pricing")}
              >
                Get Lifetime Access
              </Button>

              {(transcriptionUsage?.hasReachedLimit || articleUsage?.hasReachedLimit) && (
                <div className="bg-red-50 rounded p-2 text-xs text-red-700 flex items-start mt-2">
                  <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                  <span>You&apos;ve reached your monthly limit. Please upgrade to continue.</span>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
