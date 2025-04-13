"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertCircle, CreditCard, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { checkUsageLimits, getUserSubscription } from "@/firebase/subscription";

interface SubscriptionUsageProps {
  userId: string;
}

export function SubscriptionUsage({ userId }: SubscriptionUsageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<{
    planId: string;
    endDate: number;
  } | null>(null);
  const [transcriptionUsage, setTranscriptionUsage] = useState<{
    used: number;
    limit: number;
    hasReachedLimit: boolean;
  } | null>(null);
  const [articleUsage, setArticleUsage] = useState<{
    used: number;
    limit: number;
    hasReachedLimit: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);

        // Fetch subscription data
        const subscriptionData = await getUserSubscription(userId);
        setSubscription(
          subscriptionData
            ? {
                planId: subscriptionData.planId,
                endDate: Date.parse(subscriptionData.endDate),
              }
            : null
        );

        // Fetch usage data
        const transcriptionLimits = await checkUsageLimits(
          userId,
          "transcription"
        );
        const articleLimits = await checkUsageLimits(userId, "article");

        setTranscriptionUsage(transcriptionLimits);
        setArticleUsage(articleLimits);
      } catch (error) {
        console.error("Error fetching subscription data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-purple-500 mr-2" />
        <span className="text-sm text-gray-600">
          Loading subscription data...
        </span>
      </div>
    );
  }

  const planName = subscription?.planId
    ? subscription.planId.charAt(0).toUpperCase() + subscription.planId.slice(1)
    : "Free";

  //   const getProgressColor = (used: number, limit: number) => {
  //     const percentage =
  //       limit === Number.POSITIVE_INFINITY ? 0 : (used / limit) * 100;
  //     if (percentage > 90) return "bg-red-500";
  //     if (percentage > 70) return "bg-yellow-500";
  //     return "bg-green-500";
  //   };

  return (
    <Card className="shadow-sm border border-gray-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center">
          <CreditCard className="h-4 w-4 mr-2 text-purple-500" />
          Subscription Usage
        </CardTitle>
        <CardDescription className="text-xs">
          {planName} Plan{" "}
          {subscription
            ? `(Renews ${new Date(subscription.endDate).toLocaleDateString()})`
            : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {transcriptionUsage && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Transcription</span>
                <span className="font-medium">
                  {transcriptionUsage.used.toFixed(1)} /{" "}
                  {transcriptionUsage.limit === Number.POSITIVE_INFINITY
                    ? "∞"
                    : transcriptionUsage.limit}{" "}
                  min
                </span>
              </div>
              <Progress
                value={
                  transcriptionUsage.limit === Number.POSITIVE_INFINITY
                    ? 0
                    : (transcriptionUsage.used / transcriptionUsage.limit) * 100
                }
                className="h-1.5"
              />
            </div>
          )}

          {articleUsage && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Articles</span>
                <span className="font-medium">
                  {articleUsage.used} /{" "}
                  {articleUsage.limit === Number.POSITIVE_INFINITY
                    ? "∞"
                    : articleUsage.limit}
                </span>
              </div>
              <Progress
                value={
                  articleUsage.limit === Number.POSITIVE_INFINITY
                    ? 0
                    : (articleUsage.used / articleUsage.limit) * 100
                }
                className="h-1.5"
              />
            </div>
          )}

          {(!subscription || subscription?.planId !== "premium") && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 text-xs h-8"
              onClick={() => router.push("/pricing")}
            >
              {subscription ? "Upgrade Plan" : "Get Subscription"}
            </Button>
          )}

          {(transcriptionUsage?.hasReachedLimit ||
            articleUsage?.hasReachedLimit) && (
            <div className="bg-red-50 rounded p-2 text-xs text-red-700 flex items-start mt-2">
              <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
              <span>
                Youve reached your monthly limit. Please upgrade your plan to
                continue.
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
