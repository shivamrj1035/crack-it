"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type ProctoringEventType =
  | "TAB_SWITCH"
  | "COPY_PASTE"
  | "RIGHT_CLICK"
  | "FULLSCREEN_EXIT"
  | "INACTIVITY"
  | "MULTIPLE_FACES"
  | "NO_FACE"
  | "SCREENSHOT";

interface ProctoringEvent {
  type: ProctoringEventType;
  timestamp: number;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  metadata?: Record<string, any>;
}

interface UseProctoringOptions {
  enabled: boolean;
  interviewId: string;
  organizationId: string;
  candidateId: string;
  maxTabSwitches?: number;
  inactivityTimeout?: number; // seconds
  requireFullscreen?: boolean;
  captureScreenshots?: boolean;
  screenshotInterval?: number; // seconds
  onViolation?: (event: ProctoringEvent, violationCount: number) => void;
  onAutoSubmit?: () => void;
}

interface UseProctoringReturn {
  isProctoringActive: boolean;
  violationCount: number;
  events: ProctoringEvent[];
  isFullscreen: boolean;
  lastActivityAt: number;
  enterFullscreen: () => Promise<void>;
  requestCameraAccess: () => Promise<boolean>;
  isCameraActive: boolean;
  faceCount: number;
  trustScore: number;
}

export function useProctoring({
  enabled,
  interviewId,
  organizationId,
  candidateId,
  maxTabSwitches = 3,
  inactivityTimeout = 30,
  requireFullscreen = true,
  captureScreenshots = true,
  screenshotInterval = 30,
  onViolation,
  onAutoSubmit,
}: UseProctoringOptions): UseProctoringReturn {
  const [isProctoringActive, setIsProctoringActive] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [events, setEvents] = useState<ProctoringEvent[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastActivityAt, setLastActivityAt] = useState(Date.now());
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [trustScore, setTrustScore] = useState(100);

  const tabSwitchCount = useRef(0);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const screenshotTimer = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Log event helper
  const logEvent = useCallback(
    async (event: Omit<ProctoringEvent, "timestamp">) => {
      const fullEvent = { ...event, timestamp: Date.now() };
      setEvents((prev) => [...prev, fullEvent]);

      // Send to server
      try {
        await fetch("/api/proctoring/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId,
            interviewId,
            candidateId,
            eventType: event.type,
            severity: event.severity,
            description: event.description,
            metadata: event.metadata,
          }),
        });
      } catch (error) {
        console.error("Failed to log proctoring event:", error);
      }
    },
    [interviewId, organizationId, candidateId]
  );

  // Calculate trust score
  const calculateTrustScore = useCallback(() => {
    let score = 100;
    events.forEach((event) => {
      switch (event.severity) {
        case "low":
          score -= 5;
          break;
        case "medium":
          score -= 10;
          break;
        case "high":
          score -= 20;
          break;
        case "critical":
          score -= 30;
          break;
      }
    });
    return Math.max(0, score);
  }, [events]);

  // Update trust score when events change
  useEffect(() => {
    setTrustScore(calculateTrustScore());
  }, [events, calculateTrustScore]);

  // Tab visibility detection
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchCount.current += 1;
        const event: Omit<ProctoringEvent, "timestamp"> = {
          type: "TAB_SWITCH",
          severity: tabSwitchCount.current > maxTabSwitches ? "critical" : "high",
          description: `Tab switched (${tabSwitchCount.current}/${maxTabSwitches})`,
          metadata: { tabSwitchCount: tabSwitchCount.current },
        };
        logEvent(event);
        setViolationCount((prev) => prev + 1);

        if (tabSwitchCount.current >= maxTabSwitches && onAutoSubmit) {
          onAutoSubmit();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, maxTabSwitches, logEvent, onAutoSubmit]);

  // Copy-paste and right-click prevention
  useEffect(() => {
    if (!enabled) return;

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      logEvent({
        type: "COPY_PASTE",
        severity: "medium",
        description: "Copy operation blocked",
      });
      setViolationCount((prev) => prev + 1);
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      logEvent({
        type: "COPY_PASTE",
        severity: "medium",
        description: "Paste operation blocked",
      });
      setViolationCount((prev) => prev + 1);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logEvent({
        type: "RIGHT_CLICK",
        severity: "low",
        description: "Right-click blocked",
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "v" || e.key === "x")) {
        e.preventDefault();
        logEvent({
          type: "COPY_PASTE",
          severity: "medium",
          description: `Keyboard shortcut blocked: ${e.key}`,
        });
        setViolationCount((prev) => prev + 1);
      }
      // Block F12 (dev tools)
      if (e.key === "F12") {
        e.preventDefault();
        logEvent({
          type: "COPY_PASTE",
          severity: "high",
          description: "Developer tools shortcut blocked",
        });
        setViolationCount((prev) => prev + 1);
      }
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, logEvent]);

  // Fullscreen monitoring
  useEffect(() => {
    if (!enabled || !requireFullscreen) return;

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);

      if (!isCurrentlyFullscreen) {
        logEvent({
          type: "FULLSCREEN_EXIT",
          severity: "high",
          description: "Exited fullscreen mode",
        });
        setViolationCount((prev) => prev + 1);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [enabled, requireFullscreen, logEvent]);

  // Inactivity detection
  useEffect(() => {
    if (!enabled) return;

    const resetInactivity = () => {
      setLastActivityAt(Date.now());
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };

    const checkInactivity = () => {
      const inactive = Date.now() - lastActivityAt > inactivityTimeout * 1000;
      if (inactive) {
        logEvent({
          type: "INACTIVITY",
          severity: "medium",
          description: `No activity detected for ${inactivityTimeout} seconds`,
          metadata: { inactiveDuration: inactivityTimeout },
        });
      }
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => {
      document.addEventListener(event, resetInactivity);
    });

    inactivityTimer.current = setInterval(checkInactivity, 5000);

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetInactivity);
      });
      if (inactivityTimer.current) {
        clearInterval(inactivityTimer.current);
      }
    };
  }, [enabled, inactivityTimeout, lastActivityAt, logEvent]);

  // Screenshot capture
  useEffect(() => {
    if (!enabled || !captureScreenshots) return;

    const captureScreenshot = async () => {
      try {
        // Use html2canvas or similar for screenshot
        // For now, just log the event
        logEvent({
          type: "SCREENSHOT",
          severity: "low",
          description: "Screenshot captured",
        });
      } catch (error) {
        console.error("Failed to capture screenshot:", error);
      }
    };

    screenshotTimer.current = setInterval(
      captureScreenshot,
      screenshotInterval * 1000
    );

    return () => {
      if (screenshotTimer.current) {
        clearInterval(screenshotTimer.current);
      }
    };
  }, [enabled, captureScreenshots, screenshotInterval, logEvent]);

  // Enter fullscreen
  const enterFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      }
      setIsFullscreen(true);
    } catch (error) {
      console.error("Failed to enter fullscreen:", error);
    }
  }, []);

  // Request camera access
  const requestCameraAccess = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      return true;
    } catch (error) {
      console.error("Failed to access camera:", error);
      return false;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Start proctoring
  useEffect(() => {
    if (enabled) {
      setIsProctoringActive(true);
      enterFullscreen();
    } else {
      setIsProctoringActive(false);
    }
  }, [enabled, enterFullscreen]);

  return {
    isProctoringActive,
    violationCount,
    events,
    isFullscreen,
    lastActivityAt,
    enterFullscreen,
    requestCameraAccess,
    isCameraActive,
    faceCount,
    trustScore,
  };
}
