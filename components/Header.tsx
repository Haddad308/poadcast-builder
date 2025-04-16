import { CreditCard, FileAudio, Settings } from "lucide-react";
import React from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

const Header = () => {
  const router = useRouter();

  return (
    <div className="text-center mb-12">
      <div className="inline-block mb-4">
        <div className="relative h-16 w-16 mx-auto">
          <div className="absolute inset-0 rounded-full bg-purple-100 animate-pulse"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <FileAudio className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>
      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 text-transparent bg-clip-text mb-4">
        Video to Podcast & Transcript
      </h1>
      <p className="text-gray-600 max-w-2xl mx-auto text-lg">
        Transform your videos into professional podcast episodes with full
        transcripts instantly. Perfect for content creators, educators, and
        businesses.
      </p>
      {/* Add settings button */}
      <div className="mt-4">
        <Button
          variant="outline"
          size="sm"
          className="text-purple-600 border-purple-200 hover:bg-purple-50"
          onClick={() => router.push("/config")}
        >
          <Settings className="h-4 w-4 mr-2" />
          Configure API Key
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-purple-600 border-purple-200 hover:bg-purple-50 ml-2"
          onClick={() => router.push("/pricing")}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Subscription Plans
        </Button>
      </div>
    </div>
  );
};

export default Header;
