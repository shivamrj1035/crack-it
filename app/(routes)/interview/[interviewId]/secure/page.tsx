"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProctoring } from "@/hooks/use-proctoring";
import { ProctoringPanel } from "@/components/proctoring/ProctoringPanel";
import { SecurityCheck } from "@/components/proctoring/SecurityCheck";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

// This is a secure interview page with proctoring
export default function SecureInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const interviewId = params.interviewId as string;

  const [showSecurityCheck, setShowSecurityCheck] = useState(true);
  const [securityPassed, setSecurityPassed] = useState(false);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [violationMessage, setViolationMessage] = useState("");
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);

  // Mock data - in production, fetch from Convex
  const organizationId = "org_123";
  const candidateId = "candidate_123";

  const handleViolation = useCallback(
    (event: any, count: number) => {
      console.log("Violation detected:", event, count);
      setViolationMessage(event.description);
      setShowViolationWarning(true);

      // Auto-submit after 3 violations
      if (count >= 3) {
        setIsAutoSubmitting(true);
        setTimeout(() => {
          handleAutoSubmit();
        }, 3000);
      }
    },
    []
  );

  const handleAutoSubmit = useCallback(() => {
    // Submit interview and redirect
    console.log("Auto-submitting interview due to violations");
    // router.push("/interview/completed?reason=violation");
  }, []);

  const handleFaceViolation = useCallback(
    (type: string, message: string) => {
      console.log("Face violation:", type, message);
      setViolationMessage(message);
      setShowViolationWarning(true);
    },
    []
  );

  const handleFaceCountChange = useCallback((count: number) => {
    console.log("Face count changed:", count);
  }, []);

  const {
    isProctoringActive,
    violationCount,
    events,
    isFullscreen,
    lastActivityAt,
    enterFullscreen,
    trustScore,
    faceCount,
  } = useProctoring({
    enabled: securityPassed,
    interviewId,
    organizationId,
    candidateId,
    maxTabSwitches: 3,
    inactivityTimeout: 30,
    requireFullscreen: true,
    captureScreenshots: true,
    screenshotInterval: 30,
    onViolation: handleViolation,
    onAutoSubmit: handleAutoSubmit,
  });

  const handleSecurityComplete = (passed: boolean) => {
    if (passed) {
      setSecurityPassed(true);
      setShowSecurityCheck(false);
    } else {
      // User cancelled - redirect away
      router.push("/dashboard");
    }
  };

  const handleEnterFullscreen = async () => {
    await enterFullscreen();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Security Check Modal */}
      <SecurityCheck
        isOpen={showSecurityCheck}
        onComplete={handleSecurityComplete}
        onEnterFullscreen={enterFullscreen}
      />

      {/* Violation Warning */}
      <AlertDialog
        open={showViolationWarning}
        onOpenChange={setShowViolationWarning}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <AlertDialogTitle>Security Violation Detected</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              {violationMessage}
              <p className="mt-2 text-red-600 font-medium">
                Violation {violationCount}/3
              </p>
              {isAutoSubmitting && (
                <p className="mt-2 text-red-600">
                  Too many violations. Auto-submitting interview...
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => setShowViolationWarning(false)}>
              I Understand
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Proctoring Panel */}
      {securityPassed && (
        <ProctoringPanel
          isActive={isProctoringActive}
          trustScore={trustScore}
          violationCount={violationCount}
          faceCount={faceCount}
          isFullscreen={isFullscreen}
          lastActivityAt={lastActivityAt}
          events={events}
          onFaceCountChange={handleFaceCountChange}
          onViolation={handleFaceViolation}
          onEnterFullscreen={handleEnterFullscreen}
        />
      )}

      {/* Interview Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-2xl font-bold mb-4">Secure Interview</h1>
          <p className="text-gray-600 mb-6">
            This is a proctored interview. The system is monitoring for:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
            <li>Tab switching (max 3 allowed)</li>
            <li>Face visibility on camera</li>
            <li>Fullscreen mode enforcement</li>
            <li>Copy-paste attempts</li>
            <li>Inactivity detection</li>
          </ul>

          {/* Interview questions would go here */}
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Question 1</h3>
              <p className="text-gray-600">
                Explain the difference between REST and GraphQL APIs.
              </p>
              <textarea
                className="w-full mt-3 p-3 border rounded-lg resize-none"
                rows={4}
                placeholder="Type your answer here..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button>Submit Answer</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
