import React from "react";
import { SubscriptionUsage } from "./subscription-usage";
import { useAuth } from "@/firebase/auth-context";
import { FileEdit, FileText, Sparkles } from "lucide-react";

const Features = () => {
  const { user } = useAuth();
  return (
    <div className="bg-purple-50 p-6 md:p-8">
      <h3 className="font-semibold text-lg mb-6 text-purple-800">
        Why Convert?
      </h3>
      <div className="space-y-6">
        <div className="flex items-start">
          <div className="bg-white p-2 rounded-full shadow-sm mr-4">
            <Sparkles className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h4 className="font-medium text-purple-900">Expand Your Reach</h4>
            <p className="text-sm text-gray-600">
              Repurpose content for audio platforms
            </p>
          </div>
        </div>
        <div className="flex items-start">
          <div className="bg-white p-2 rounded-full shadow-sm mr-4">
            <FileText className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h4 className="font-medium text-purple-900">SEO Benefits</h4>
            <p className="text-sm text-gray-600">
              Transcripts improve content discoverability
            </p>
          </div>
        </div>
        <div className="flex items-start">
          <div className="bg-white p-2 rounded-full shadow-sm mr-4">
            <FileEdit className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <h4 className="font-medium text-purple-900">
              AI-Generated Articles
            </h4>
            <p className="text-sm text-gray-600">
              Turn your videos into blog posts automatically
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h3 className="font-semibold text-lg mb-4 text-purple-800">
          Supported Formats
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {["MP4", "MOV", "AVI", "MKV", "WEBM", "FLV"].map((format) => (
            <div
              key={format}
              className="bg-white rounded-md py-1 px-2 text-center text-sm font-medium text-purple-700 shadow-sm"
            >
              {format}
            </div>
          ))}
        </div>
      </div>

      {user && (
        <div className="mt-6">
          <SubscriptionUsage userId={user.uid} />
        </div>
      )}
    </div>
  );
};

export default Features;
