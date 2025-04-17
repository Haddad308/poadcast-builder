/* eslint-disable @typescript-eslint/no-explicit-any */
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
import {
  CheckCircle,
  ArrowLeft,
  CreditCard,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/firebase/auth-context";
import {
  getUserSubscription,
  updateUserSubscription,
} from "@/firebase/subscription";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

// Define the lifetime plan
const lifetimePlan = {
  id: "lifetime",
  name: "Lifetime Access",
  price: 79,
  features: [
    "Unlimited transcription",
    "Unlimited AI-generated articles",
    "MP3 podcast conversion",
    "Priority email support",
    "Download in multiple formats",
    "Custom branding options",
    "API access",
    "All future updates",
    "No recurring fees",
  ],
};

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [hasLifetimeAccess, setHasLifetimeAccess] = useState(false);
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
        setHasLifetimeAccess(
          subscription?.planId === "lifetime" &&
            subscription?.status === "active"
        );
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [user, router]);

  const createOrder = (data: any, actions: any) => {
    return actions.order.create({
      intent: "CAPTURE",
      purchase_units: [
        {
          description: "Lifetime Access to Video to Podcast & Transcript",
          amount: {
            currency_code: "USD",
            value: lifetimePlan.price.toString(),
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
          planId: "lifetime",
          orderId: details.id,
          status: "active",
          startDate: new Date().toISOString(),
          // No end date for lifetime access
          endDate: null,
          isLifetime: true,
        });

        setHasLifetimeAccess(true);
        alert(
          "Payment successful! Thank you for your purchase. You now have lifetime access to all features."
        );
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("There was an error processing your payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
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
            Lifetime Access
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Get unlimited access to all features forever with a one-time
            payment. No subscriptions, no recurring fees.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        ) : hasLifetimeAccess ? (
          <div className="max-w-md mx-auto">
            <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center text-green-800">
                  <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
                  You Have Lifetime Access
                </CardTitle>
                <CardDescription className="text-green-700">
                  Thank you for your purchase! You have unlimited access to all
                  features.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-green-700">
                  You can now enjoy unlimited transcription, article generation,
                  and all premium features without any restrictions.
                </p>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => router.push("/")}
                >
                  Return to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="max-w-2xl mx-auto mb-12">
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Lifetime Access</h2>
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1 text-sm font-bold">
                      One-time Payment
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-5xl font-extrabold">
                      ${lifetimePlan.price}
                    </span>
                    <span className="ml-2 text-xl text-white/70 line-through">
                      $199
                    </span>
                    <span className="ml-2 text-white/90">60% off</span>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {lifetimePlan.features.map((feature, index) => (
                      <div key={index} className="flex items-start">
                        <div className="bg-purple-100 p-1 rounded-full mr-2 mt-0.5">
                          <CheckCircle className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex items-start">
                      <Sparkles className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <span className="font-medium">Limited time offer:</span>{" "}
                        Get lifetime access at our lowest price ever. This offer
                        won&ldquo;t last long!
                      </div>
                    </div>

                    <PayPalScriptProvider
                      options={{
                        clientId: paypalClientId,
                        currency: "USD",
                      }}
                    >
                      <PayPalButtons
                        style={{ layout: "vertical", color: "blue" }}
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
                  </div>
                </CardContent>

                <CardFooter className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                  <div className="text-sm text-gray-500 flex items-center">
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
                      className="mr-2"
                    >
                      <rect
                        x="3"
                        y="11"
                        width="18"
                        height="11"
                        rx="2"
                        ry="2"
                      ></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    Secure payment via PayPal. 30-day money-back guarantee.
                  </div>
                </CardFooter>
              </Card>
            </div>

            <div className="max-w-3xl mx-auto">
              <h3 className="text-xl font-semibold text-center mb-6">
                Frequently Asked Questions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      What does &ldquo;lifetime access&ldquo; mean?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600">
                    Lifetime access means you pay once and get unlimited access
                    to all features forever. No monthly subscriptions or
                    recurring fees.
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Do I get access to future updates?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600">
                    Yes! Your lifetime purchase includes all future updates and
                    new features we add to the platform.
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Is there a usage limit?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600">
                    No, with lifetime access you get unlimited transcription
                    minutes and article generation. Use the service as much as
                    you need.
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      What if I&ldquo;m not satisfied?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600">
                    We offer a 30-day money-back guarantee. If you&ldquo;re not
                    happy with the service, just contact us for a full refund.
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
