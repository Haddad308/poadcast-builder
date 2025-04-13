"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowLeft, CreditCard, Loader2 } from "lucide-react";
import { useAuth } from "@/firebase/auth-context";
import {
  getUserSubscription,
  updateUserSubscription,
} from "@/firebase/subscription";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

// Define the subscription plans
const plans = [
  {
    id: "basic",
    name: "Basic",
    price: 9.99,
    features: [
      "30 minutes of transcription per month",
      "5 AI-generated articles per month",
      "MP3 podcast conversion",
      "Basic email support",
    ],
    popular: false,
    color: "blue",
  },
  {
    id: "pro",
    name: "Pro",
    price: 19.99,
    features: [
      "120 minutes of transcription per month",
      "20 AI-generated articles per month",
      "MP3 podcast conversion",
      "Priority email support",
      "Download in multiple formats",
    ],
    popular: true,
    color: "purple",
  },
  {
    id: "premium",
    name: "Premium",
    price: 39.99,
    features: [
      "Unlimited transcription",
      "Unlimited AI-generated articles",
      "MP3 podcast conversion",
      "Priority email support",
      "Download in multiple formats",
      "Custom branding options",
      "API access",
    ],
    popular: false,
    color: "pink",
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // PayPal client ID - replace with your actual client ID in production
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "sb"; // "sb" is for sandbox testing

  useEffect(() => {
    if (!user) {
      router.push("/signin");
      return;
    }

    const fetchSubscription = async () => {
      try {
        setIsLoading(true);
        const subscription = await getUserSubscription(user.uid);
        setCurrentSubscription(subscription?.planId || null);
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [user, router]);

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const createOrder = (
    data: Record<string, unknown>,
    actions: {
      order: {
        create: (data: {
          purchase_units: Array<{
            description: string;
            amount: {
              currency_code: string;
              value: string;
            };
          }>;
          application_context: {
            shipping_preference:
              | "NO_SHIPPING"
              | "GET_FROM_FILE"
              | "SET_PROVIDED_ADDRESS";
          };
        }) => Promise<string>;
      };
    }
  ) => {
    const plan = plans.find((p) => p.id === selectedPlan);
    if (!plan) return Promise.reject("No plan selected");

    return actions.order.create({
      purchase_units: [
        {
          description: `${plan.name} Plan Subscription`,
          amount: {
            currency_code: "USD",
            value: plan.price.toString(),
          },
        },
      ],
      application_context: {
        shipping_preference: "NO_SHIPPING",
      },
    });
  };

  const onApprove = async (data: any, actions: any) => {
    try {
      setIsProcessing(true);
      const details = await actions.order.capture();

      if (details.status === "COMPLETED" && user) {
        // Update user's subscription in Firebase
        await updateUserSubscription(user.uid, {
          planId: selectedPlan,
          orderId: details.id,
          status: "active",
          startDate: new Date().toISOString(),
          // Set end date to 30 days from now
          endDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        });

        setCurrentSubscription(selectedPlan);
        alert("Subscription successful! Thank you for your purchase.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("There was an error processing your payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getColorClass = (
    colorName: string,
    element: "bg" | "text" | "border"
  ) => {
    const colorMap: Record<string, Record<string, string>> = {
      blue: {
        bg: "bg-blue-500",
        text: "text-blue-600",
        border: "border-blue-200",
      },
      purple: {
        bg: "bg-purple-500",
        text: "text-purple-600",
        border: "border-purple-200",
      },
      pink: {
        bg: "bg-pink-500",
        text: "text-pink-600",
        border: "border-pink-200",
      },
    };

    return colorMap[colorName]?.[element] || colorMap.blue[element];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <Button
          variant="ghost"
          className="mb-6 text-purple-600 hover:text-purple-800 hover:bg-purple-100"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="text-center mb-12">
          <div className="inline-block mb-4 bg-purple-100 p-3 rounded-full">
            <CreditCard className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Choose Your Plan
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Select the perfect plan for your needs. Upgrade or downgrade
            anytime.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            <span className="ml-3 text-gray-600">
              Loading subscription details...
            </span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative overflow-hidden transition-all ${
                    selectedPlan === plan.id
                      ? "border-2 " +
                        getColorClass(plan.color, "border") +
                        " shadow-lg transform -translate-y-1"
                      : "border hover:shadow-md"
                  } ${
                    currentSubscription === plan.id
                      ? "ring-2 ring-green-400"
                      : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0">
                      <div
                        className={`${getColorClass(
                          plan.color,
                          "bg"
                        )} text-white py-1 px-4 text-xs font-bold uppercase transform rotate-45 translate-x-5 translate-y-1`}
                      >
                        Popular
                      </div>
                    </div>
                  )}

                  {currentSubscription === plan.id && (
                    <div className="absolute top-4 left-4 bg-green-100 text-green-800 text-xs py-1 px-2 rounded-full flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Current Plan
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className={getColorClass(plan.color, "text")}>
                      {plan.name}
                    </CardTitle>
                    <CardDescription>
                      <span className="text-2xl font-bold">${plan.price}</span>{" "}
                      / month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 min-h-[240px]">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-600">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    {currentSubscription === plan.id ? (
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled
                      >
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        className={`w-full ${getColorClass(
                          plan.color,
                          "bg"
                        )} hover:opacity-90 text-white`}
                        onClick={() => handlePlanSelect(plan.id)}
                      >
                        {selectedPlan === plan.id ? "Selected" : "Select Plan"}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>

            {selectedPlan && (
              <div className="max-w-md mx-auto">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Complete Your Subscription</CardTitle>
                    <CardDescription>
                      Youve selected the{" "}
                      <Badge
                        variant="outline"
                        className={getColorClass(
                          plans.find((p) => p.id === selectedPlan)?.color ||
                            "blue",
                          "text"
                        )}
                      >
                        {plans.find((p) => p.id === selectedPlan)?.name}
                      </Badge>{" "}
                      plan
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PayPalScriptProvider
                      options={{
                        clientId: paypalClientId,
                        currency: "USD",
                        intent: "capture",
                      }}
                    >
                      <PayPalButtons
                        style={{ layout: "vertical" }}
                        createOrder={createOrder}
                        onApprove={onApprove}
                        disabled={isProcessing}
                      />
                    </PayPalScriptProvider>

                    {isProcessing && (
                      <div className="flex justify-center items-center mt-4">
                        <Loader2 className="h-5 w-5 animate-spin text-purple-500 mr-2" />
                        <span className="text-sm text-gray-600">
                          Processing your payment...
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="mt-12 bg-blue-50 rounded-lg p-4 text-sm text-blue-700 max-w-3xl mx-auto">
              <div className="flex items-start">
                <div className="bg-blue-100 p-1 rounded-full mr-2 mt-0.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
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
                  <span className="font-medium">Secure Payments:</span> All
                  transactions are processed securely through PayPal. We do not
                  store your payment information. Subscriptions are billed
                  monthly and can be canceled anytime from your account
                  settings.
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
