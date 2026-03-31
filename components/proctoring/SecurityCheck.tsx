"use client";

import { useState, useEffect } from "react";
import { Shield, Camera, Maximize, AlertTriangle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface SecurityCheckProps {
  isOpen: boolean;
  onComplete: (passed: boolean) => void;
  onEnterFullscreen: () => Promise<void>;
}

type CheckStatus = "pending" | "checking" | "passed" | "failed";

interface CheckItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: CheckStatus;
}

export function SecurityCheck({
  isOpen,
  onComplete,
  onEnterFullscreen,
}: SecurityCheckProps) {
  const [checks, setChecks] = useState<CheckItem[]>([
    {
      id: "fullscreen",
      name: "Fullscreen Mode",
      description: "Interview must be taken in fullscreen",
      icon: <Maximize className="w-5 h-5" />,
      status: "pending",
    },
    {
      id: "camera",
      name: "Camera Access",
      description: "Camera required for identity verification",
      icon: <Camera className="w-5 h-5" />,
      status: "pending",
    },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const updateCheckStatus = (id: string, status: CheckStatus) => {
    setChecks((prev) =>
      prev.map((check) => (check.id === id ? { ...check, status } : check))
    );
  };

  // Check fullscreen
  const checkFullscreen = async () => {
    updateCheckStatus("fullscreen", "checking");

    try {
      await onEnterFullscreen();
      // Small delay to allow fullscreen to activate
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (document.fullscreenElement) {
        updateCheckStatus("fullscreen", "passed");
        return true;
      } else {
        updateCheckStatus("fullscreen", "failed");
        return false;
      }
    } catch (error) {
      updateCheckStatus("fullscreen", "failed");
      return false;
    }
  };

  // Check camera
  const checkCamera = async () => {
    updateCheckStatus("camera", "checking");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      setCameraStream(stream);
      updateCheckStatus("camera", "passed");
      return true;
    } catch (error) {
      console.error("Camera access denied:", error);
      updateCheckStatus("camera", "failed");
      return false;
    }
  };

  // Run all checks
  const runChecks = async () => {
    setIsRunning(true);

    // Check fullscreen first
    const fullscreenPassed = await checkFullscreen();

    // Then check camera
    const cameraPassed = await checkCamera();

    setIsRunning(false);

    // If all passed, complete
    if (fullscreenPassed && cameraPassed) {
      onComplete(true);
    }
  };

  // Retry failed check
  const retryCheck = async (id: string) => {
    if (id === "fullscreen") {
      await checkFullscreen();
    } else if (id === "camera") {
      await checkCamera();
    }
  };

  // Complete if all checks passed
  useEffect(() => {
    const allPassed = checks.every((check) => check.status === "passed");
    if (allPassed && !isRunning) {
      // Small delay to show success state
      const timer = setTimeout(() => {
        onComplete(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [checks, isRunning, onComplete]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  const getStatusIcon = (status: CheckStatus) => {
    switch (status) {
      case "passed":
        return <Check className="w-5 h-5 text-green-500" />;
      case "failed":
        return <X className="w-5 h-5 text-red-500" />;
      case "checking":
        return (
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const canProceed = checks.every((check) => check.status === "passed");

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Security Check</DialogTitle>
              <DialogDescription>
                Please complete the following checks before starting your interview
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 my-4">
          {checks.map((check) => (
            <div
              key={check.id}
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg border-2 transition-all",
                check.status === "passed"
                  ? "border-green-200 bg-green-50"
                  : check.status === "failed"
                  ? "border-red-200 bg-red-50"
                  : check.status === "checking"
                  ? "border-blue-200 bg-blue-50"
                  : "border-gray-200 bg-gray-50"
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-lg",
                  check.status === "passed"
                    ? "bg-green-100"
                    : check.status === "failed"
                    ? "bg-red-100"
                    : check.status === "checking"
                    ? "bg-blue-100"
                    : "bg-gray-100"
                )}
              >
                {check.icon}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{check.name}</h4>
                  {getStatusIcon(check.status)}
                </div>
                <p className="text-sm text-gray-600 mt-1">{check.description}</p>

                {check.status === "failed" && (
                  <div className="mt-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600">
                      {check.id === "camera"
                        ? "Camera access is required"
                        : "Fullscreen mode is required"}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => retryCheck(check.id)}
                      disabled={isRunning}
                    >
                      Retry
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onComplete(false)}
            disabled={isRunning}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={runChecks}
            disabled={isRunning || canProceed}
          >
            {isRunning ? "Checking..." : canProceed ? "All Checks Passed" : "Start Checks"}
          </Button>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Important:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Do not switch tabs or applications</li>
                <li>Keep your face visible on camera at all times</li>
                <li>Do not copy-paste or use external resources</li>
                <li>Multiple violations may result in auto-submission</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
