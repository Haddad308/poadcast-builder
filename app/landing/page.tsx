"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  ArrowRight,
  Play,
  FileAudio,
  FileText,
  FileEdit,
  Sparkles,
  Zap,
  Users,
  CreditCard,
  Infinity,
} from "lucide-react";
import { useAuth } from "@/firebase/auth-context";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGetStarted = () => {
    if (user) {
      router.push("/");
    } else {
      router.push("/signin");
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Sticky Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-md py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <FileAudio className="h-8 w-8 text-purple-600 mr-2" />
            <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-500 text-transparent bg-clip-text">
              PodcastAI
            </span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Button
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => router.push("/")}
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => router.push("/signin")}>
                  Sign In
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => router.push("/signin")}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="space-y-6"
            >
              <Badge className="px-3 py-1 bg-purple-100 text-purple-800 border-purple-200 mb-4">
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                AI-Powered Conversion
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight bg-gradient-to-r from-purple-600 to-pink-500 text-transparent bg-clip-text">
                Transform Videos into Podcasts Instantly
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl">
                Convert your videos into professional podcast episodes with full
                transcripts and AI-generated articles. Perfect for content
                creators, educators, and businesses.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all"
                  onClick={handleGetStarted}
                >
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-purple-200 text-purple-600 hover:bg-purple-50"
                  onClick={() => {
                    const demoSection = document.getElementById("how-it-works");
                    demoSection?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <Play className="mr-2 h-4 w-4" />
                  See How It Works
                </Button>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <CheckCircle className="text-green-500 h-5 w-5" />
                <span className="text-sm text-gray-500">
                  One-time payment, lifetime access
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-lg opacity-30 animate-pulse"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-purple-100 dark:border-purple-900">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
                  <div className="flex items-center">
                    <FileAudio className="h-5 w-5 mr-2" />
                    <span className="font-medium">
                      Video to Podcast Converter
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <FileAudio className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          marketing_video.mp4
                        </p>
                        <div className="text-xs text-gray-500">
                          24.5 MB • MP4
                        </div>
                      </div>
                    </div>

                    <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 w-3/4 animate-pulse"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-purple-50 rounded-lg p-3 flex items-center">
                        <div className="bg-white p-2 rounded-full shadow-sm mr-3">
                          <FileAudio className="h-4 w-4 text-purple-500" />
                        </div>
                        <div className="text-xs">
                          <div className="font-medium text-purple-900">
                            MP3 Podcast
                          </div>
                          <div className="text-gray-600">Ready to publish</div>
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 flex items-center">
                        <div className="bg-white p-2 rounded-full shadow-sm mr-3">
                          <FileText className="h-4 w-4 text-purple-500" />
                        </div>
                        <div className="text-xs">
                          <div className="font-medium text-purple-900">
                            Transcript
                          </div>
                          <div className="text-gray-600">Full text</div>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Convert with AI
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-950" id="features">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="px-3 py-1 bg-purple-100 text-purple-800 border-purple-200 mb-4">
              Powerful Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need in One Place
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Our platform combines cutting-edge AI technology with an intuitive
              interface to deliver a seamless experience for content creators.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                icon: <FileAudio className="h-8 w-8 text-purple-600" />,
                title: "High-Quality Audio Conversion",
                description:
                  "Convert any video format into podcast-ready MP3 files with crystal-clear audio quality, perfect for distribution on all podcast platforms.",
              },
              {
                icon: <FileText className="h-8 w-8 text-purple-600" />,
                title: "AI-Powered Transcription",
                description:
                  "Get accurate transcriptions of your content using Whisper Large V3 Turbo, making your content accessible and SEO-friendly.",
              },
              {
                icon: <FileEdit className="h-8 w-8 text-purple-600" />,
                title: "Article Generation",
                description:
                  "Automatically transform your video content into well-structured blog articles, saving hours of writing and editing time.",
              },
              {
                icon: <Zap className="h-8 w-8 text-purple-600" />,
                title: "Lightning-Fast Processing",
                description:
                  "Our optimized conversion engine processes your videos quickly, so you can focus on creating great content.",
              },
              {
                icon: <Infinity className="h-8 w-8 text-purple-600" />,
                title: "Unlimited Usage",
                description:
                  "With our lifetime plan, enjoy unlimited transcription minutes and article generation without any monthly limits.",
              },
              {
                icon: <Users className="h-8 w-8 text-purple-600" />,
                title: "Perfect for Teams",
                description:
                  "Ideal for content creators, marketing teams, educators, and businesses looking to repurpose video content efficiently.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeIn}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-md hover:shadow-xl transition-shadow p-6 border border-gray-100 dark:border-gray-800"
              >
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg w-fit mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        className="py-20 bg-gradient-to-b from-white to-purple-50 dark:from-gray-950 dark:to-gray-900"
        id="how-it-works"
      >
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="px-3 py-1 bg-purple-100 text-purple-800 border-purple-200 mb-4">
              Simple Process
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Converting your videos to podcasts and articles is as easy as
              1-2-3. Our intuitive platform makes the process seamless.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 transform -translate-y-1/2 z-0"></div>

            {[
              {
                step: "01",
                title: "Upload Your Video",
                description:
                  "Simply drag and drop your video file or paste a URL. We support all major video formats including MP4, MOV, AVI, and more.",
                icon: <Play className="h-6 w-6 text-purple-600" />,
              },
              {
                step: "02",
                title: "AI Processing",
                description:
                  "Our AI engine converts your video to audio, transcribes the content, and generates a well-structured article based on your content.",
                icon: <Sparkles className="h-6 w-6 text-purple-600" />,
              },
              {
                step: "03",
                title: "Download & Share",
                description:
                  "Download your podcast audio, full transcript, and ready-to-publish article. Share your content across multiple platforms.",
                icon: <FileAudio className="h-6 w-6 text-purple-600" />,
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-purple-100 dark:border-purple-900 relative z-10"
              >
                <div className="bg-purple-600 text-white text-xl font-bold w-12 h-12 rounded-full flex items-center justify-center mb-6 mx-auto">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  {step.description}
                </p>
                <div className="mt-6 flex justify-center">
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-full">
                    {step.icon}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="px-3 py-1 bg-purple-100 text-purple-800 border-purple-200 mb-4">
              Perfect For
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Who Can Benefit
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Our platform is designed to help a wide range of content creators
              and businesses repurpose their video content efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "Content Creators & YouTubers",
                description:
                  "Expand your reach by turning your YouTube videos into podcasts and blog articles, reaching audiences across different platforms with minimal effort.",
                image: "/placeholder.svg?height=200&width=400",
              },
              {
                title: "Businesses & Marketers",
                description:
                  "Repurpose your marketing videos, webinars, and presentations into various content formats to maximize your content marketing strategy.",
                image: "/placeholder.svg?height=200&width=400",
              },
              {
                title: "Educators & Trainers",
                description:
                  "Convert your educational videos into accessible formats for students, including audio podcasts for on-the-go learning and transcripts for reference.",
                image: "/placeholder.svg?height=200&width=400",
              },
              {
                title: "Podcasters",
                description:
                  "If you record video podcasts, easily convert them to audio-only formats and get transcripts to create show notes and blog content from your episodes.",
                image: "/placeholder.svg?height=200&width=400",
              },
            ].map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900/20 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-3">
                    {useCase.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {useCase.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-purple-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <Badge className="px-3 py-1 bg-purple-100 text-purple-800 border-purple-200 mb-4">
              Testimonials
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Our Users Say
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Don&apos;t just take our word for it. Here&apos;s what content
              creators and businesses are saying about our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote:
                  "This tool has completely transformed my content strategy. I can now create podcasts and blog posts from my YouTube videos in minutes instead of hours.",
                author: "Sarah Johnson",
                role: "Content Creator",
              },
              {
                quote:
                  "The transcription accuracy is impressive, and the AI-generated articles are surprisingly well-written. This has saved our marketing team countless hours of work.",
                author: "Michael Chen",
                role: "Marketing Director",
              },
              {
                quote:
                  "As an educator, I needed a way to make my video lessons more accessible. This platform does exactly that, providing high-quality audio and accurate transcripts for my students.",
                author: "Dr. Emily Rodriguez",
                role: "University Professor",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-purple-100 dark:border-purple-900"
              >
                <div className="mb-4 text-purple-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
                    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6 italic">
                  {testimonial.quote}
                </p>
                <div className="flex items-center">
                  <div className="bg-purple-100 dark:bg-purple-900/50 w-10 h-10 rounded-full flex items-center justify-center text-purple-600 font-bold">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">{testimonial.author}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white dark:bg-gray-950" id="pricing">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <Badge className="px-3 py-1 bg-purple-100 text-purple-800 border-purple-200 mb-4">
              Simple Pricing
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Lifetime Access, One Payment
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              No subscriptions, no recurring fees. Pay once and get unlimited
              access to all features forever.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Lifetime Access</h2>
                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1 text-sm font-bold">
                    One-time Payment
                  </div>
                </div>
                <div className="mt-4 flex items-baseline">
                  <span className="text-5xl font-extrabold">$79</span>
                  <span className="ml-2 text-xl text-white/70 line-through">
                    $199
                  </span>
                  <span className="ml-2 text-white/90">60% off</span>
                </div>
              </div>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {[
                    "Unlimited transcription",
                    "Unlimited AI-generated articles",
                    "MP3 podcast conversion",
                    "Priority email support",
                    "Download in multiple formats",
                    "Custom branding options",
                    "API access",
                    "All future updates",
                    "No recurring fees",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <div className="bg-purple-100 p-1 rounded-full mr-2 mt-0.5">
                        <CheckCircle className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-lg p-4 flex items-start">
                    <Sparkles className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800 dark:text-amber-300">
                      <span className="font-medium">Limited time offer:</span>{" "}
                      Get lifetime access at our lowest price ever. This offer
                      won&apos;t last long!
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all"
                    onClick={() => router.push("/pricing")}
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    Get Lifetime Access Now
                  </Button>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500 flex items-center justify-center">
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
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-purple-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <Badge className="px-3 py-1 bg-purple-100 text-purple-800 border-purple-200 mb-4">
              FAQ
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Find answers to common questions about our platform and services.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {[
              {
                question: "What does 'lifetime access' mean?",
                answer:
                  "Lifetime access means you pay once and get unlimited access to all features forever. No monthly subscriptions or recurring fees. You'll also receive all future updates and new features we add to the platform.",
              },
              {
                question: "What video formats are supported?",
                answer:
                  "We support all major video formats including MP4, MOV, AVI, MKV, WEBM, and FLV. If you have a video in another format, you can still try uploading it as our converter is quite versatile.",
              },
              {
                question: "How accurate is the transcription?",
                answer:
                  "We use OpenAI's Whisper Large V3 Turbo model, which provides industry-leading transcription accuracy. It works well with different accents, background noise, and technical terminology. However, extremely poor audio quality may affect results.",
              },
              {
                question: "Can I cancel my purchase?",
                answer:
                  "Yes, we offer a 30-day money-back guarantee. If you're not satisfied with our service for any reason, simply contact our support team within 30 days of purchase for a full refund.",
              },
              {
                question: "Is there a limit to how many videos I can convert?",
                answer:
                  "With our lifetime plan, there are no limits on the number of videos you can convert, transcribe, or generate articles from. Use the service as much as you need.",
              },
              {
                question: "Do I need technical knowledge to use this tool?",
                answer:
                  "Not at all! Our platform is designed to be user-friendly and intuitive. Simply upload your video, select your options, and let our AI do the rest. No technical expertise required.",
              },
            ].map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-purple-100 dark:border-purple-900 rounded-lg bg-white dark:bg-gray-800 shadow-sm"
              >
                <AccordionTrigger className="px-6 py-4 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-t-lg">
                  <span className="text-left font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="px-6 py-4 text-gray-600 dark:text-gray-300">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Transform Your Content?
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Join thousands of content creators who are saving time and
              expanding their reach with our AI-powered platform.
            </p>
            <div className="pt-4">
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all"
                onClick={handleGetStarted}
              >
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <p className="text-sm text-white/70">
              30-day money-back guarantee. No risk, all reward.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center">
                <FileAudio className="h-6 w-6 text-purple-400 mr-2" />
                <span className="font-bold text-xl">PodcastAI</span>
              </div>
              <p className="text-gray-400 text-sm">
                Transform your videos into podcasts and articles with AI-powered
                technology.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
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
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
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
                  >
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
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
                  >
                    <rect
                      x="2"
                      y="2"
                      width="20"
                      height="20"
                      rx="5"
                      ry="5"
                    ></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    API
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Contact Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Stay Updated</h3>
              <p className="text-gray-400 text-sm mb-4">
                Subscribe to our newsletter for the latest updates and features.
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="bg-gray-800 text-white px-4 py-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-purple-500 w-full"
                />
                <Button className="bg-purple-600 hover:bg-purple-700 rounded-l-none">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400 text-sm">
            <p>
              &copy; {new Date().getFullYear()} PodcastAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
