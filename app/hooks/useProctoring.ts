"use client";

import { useEffect, useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

interface ProctoringConfig {
  interviewId: any;
  enabled: boolean;
  allowTabSwitch?: boolean;
  requireFullscreen?: boolean;
  blockCopyPaste?: boolean;
}

export const useProctoring = ({
  interviewId,
  enabled,
  allowTabSwitch = false,
  requireFullscreen = true,
  blockCopyPaste = true,
}: ProctoringConfig) => {
  const logEvent = useMutation(api.proctoring.logEvent);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  const reportViolation = useCallback(async (type: string, severity: string, details?: string) => {
    if (!enabled) return;
    
    console.warn(`[Proctoring Violation] ${type}: ${details}`);
    toast.warning(`Violation Detected: ${type}`, {
      description: details,
    });

    try {
      await logEvent({
        interviewId,
        type,
        severity,
        details,
      });
    } catch (err) {
      console.error("Failed to log proctoring event:", err);
    }
  }, [enabled, interviewId, logEvent]);

  useEffect(() => {
    if (!enabled) return;

    // 1. Tab Visibility Detection
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (!allowTabSwitch) {
          setTabSwitchCount((prev) => prev + 1);
          reportViolation(
            "TAB_SWITCH", 
            "MEDIUM", 
            "Candidate switched away from the interview tab."
          );
        }
      }
    };

    // 2. Fullscreen Monitoring
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && requireFullscreen) {
        reportViolation(
          "FULLSCREEN_EXIT", 
          "LOW", 
          "Candidate exited fullscreen mode."
        );
      }
    };

    // 3. Copy-Paste Prevention
    const handleCopy = (e: ClipboardEvent) => {
      if (blockCopyPaste) {
        e.preventDefault();
        reportViolation("COPY_PASTE", "LOW", "Attempted to copy text.");
        toast.error("Copying text is disabled during the interview.");
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      if (blockCopyPaste) {
        e.preventDefault();
        reportViolation("COPY_PASTE", "MEDIUM", "Attempted to paste text.");
        toast.error("Pasting text is disabled during the interview.");
      }
    };

    // 4. Keyboard Shortcuts (ContextMenu etc.)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [enabled, allowTabSwitch, requireFullscreen, blockCopyPaste, reportViolation]);

  return {
    tabSwitchCount,
    reportViolation,
  };
};
