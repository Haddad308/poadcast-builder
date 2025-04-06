"use client";

import { useState } from "react";
import { CheckCircle, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface SuccessAlertProps {
  enableTranscription: boolean;
}

export function SuccessAlert({ enableTranscription }: SuccessAlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
    // Small delay to allow animation to complete
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Alert className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30">
            {/* Success icon with animated circle */}
            <div className="relative mr-4 ">
              <div className="absolute inset-0 rounded-full bg-green-100 dark:bg-green-800/30 animate-ping opacity-50"></div>
              <div className="relative">
                <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <AlertTitle className="text-green-800 dark:text-green-300 font-medium text-base mb-1">
                Conversion Complete
              </AlertTitle>
              <AlertDescription className="text-green-700/80 dark:text-green-300/80">
                Your video has been successfully converted to audio
                {enableTranscription ? " and transcribed" : ""}. Your files are
                ready to download.
              </AlertDescription>
            </div>

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 rounded-full hover:bg-green-200/50 dark:hover:bg-green-800/30 text-green-700 dark:text-green-400"
              onClick={handleClose}
              aria-label="Close alert"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </Alert>

          {/* Add animation keyframes */}
          <style jsx global>{`
            @keyframes shrink {
              from {
                width: 100%;
              }
              to {
                width: 0%;
              }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
