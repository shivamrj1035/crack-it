"use client";

import { useState } from "react";
import {
  Monitor,
  Eye,
  Maximize,
  Clock,
  AlertTriangle,
  Shield,
  Camera,
  Copy,
  MousePointer,
} from "lucide-react";
import { FaceDetection } from "./FaceDetection";
import { cn } from "@/lib/utils";

interface ProctoringPanelProps {
  isActive: boolean;
  trustScore: number;
  violationCount: number;
  faceCount: number;
  isFullscreen: boolean;
  lastActivityAt: number;
  events: Array<{
    type: string;
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    timestamp: number;
  }>;
  onFaceCountChange: (count: number) => void;
  onViolation: (type: string, message: string) => void;
  onEnterFullscreen: () => void;
}

export function ProctoringPanel({
  isActive,
  trustScore,
  violationCount,
  faceCount,
  isFullscreen,
  lastActivityAt,
  events,
  onFaceCountChange,
  onViolation,
  onEnterFullscreen,
}: ProctoringPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "high":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case "medium":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const timeSinceActivity = Math.floor(
    (Date.now() - lastActivityAt) / 1000
  );

  return (
    <div
      className={cn(
        "fixed right-4 top-4 z-50 bg-white rounded-lg shadow-lg border transition-all duration-300",
        isExpanded ? "w-80" : "w-auto"
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 border-b cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-3 h-3 rounded-full",
              isActive ? "bg-green-500 animate-pulse" : "bg-gray-400"
            )}
          />
          <span className="font-medium">Proctoring Active</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-lg font-bold", getTrustScoreColor(trustScore))}>
            {trustScore}%
          </span>
          <Shield className="w-5 h-5 text-gray-500" />
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Trust Score Bar */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Trust Score</span>
              <span className={getTrustScoreColor(trustScore)}>{trustScore}/100</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  trustScore >= 80
                    ? "bg-green-500"
                    : trustScore >= 60
                    ? "bg-yellow-500"
                    : trustScore >= 40
                    ? "bg-orange-500"
                    : "bg-red-500"
                )}
                style={{ width: `${trustScore}%` }}
              />
            </div>
          </div>

          {/* Security Status Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div
              className={cn(
                "flex items-center gap-2 p-2 rounded border",
                isFullscreen
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              )}
            >
              <Maximize
                className={cn(
                  "w-4 h-4",
                  isFullscreen ? "text-green-600" : "text-red-600"
                )}
              />
              <div className="flex-1">
                <p className="text-xs font-medium">Fullscreen</p>
                <p
                  className={cn(
                    "text-[10px]",
                    isFullscreen ? "text-green-600" : "text-red-600"
                  )}
                >
                  {isFullscreen ? "Active" : "Required"}
                </p>
              </div>
            </div>

            <div
              className={cn(
                "flex items-center gap-2 p-2 rounded border",
                faceCount === 1
                  ? "bg-green-50 border-green-200"
                  : faceCount === 0
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-red-50 border-red-200"
              )}
            >
              <Camera
                className={cn(
                  "w-4 h-4",
                  faceCount === 1
                    ? "text-green-600"
                    : faceCount === 0
                    ? "text-yellow-600"
                    : "text-red-600"
                )}
              />
              <div className="flex-1">
                <p className="text-xs font-medium">Camera</p>
                <p
                  className={cn(
                    "text-[10px]",
                    faceCount === 1
                      ? "text-green-600"
                      : faceCount === 0
                      ? "text-yellow-600"
                      : "text-red-600"
                  )}
                >
                  {faceCount === 1
                    ? "1 face"
                    : faceCount === 0
                    ? "No face"
                    : `${faceCount} faces`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded border bg-gray-50">
              <Clock className="w-4 h-4 text-gray-600" />
              <div className="flex-1">
                <p className="text-xs font-medium">Activity</p>
                <p className="text-[10px] text-gray-600">
                  {timeSinceActivity}s ago
                </p>
              </div>
            </div>

            <div
              className={cn(
                "flex items-center gap-2 p-2 rounded border",
                violationCount === 0
                  ? "bg-green-50 border-green-200"
                  : violationCount < 3
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-red-50 border-red-200"
              )}
            >
              <AlertTriangle
                className={cn(
                  "w-4 h-4",
                  violationCount === 0
                    ? "text-green-600"
                    : violationCount < 3
                    ? "text-yellow-600"
                    : "text-red-600"
                )}
              />
              <div className="flex-1">
                <p className="text-xs font-medium">Violations</p>
                <p
                  className={cn(
                    "text-[10px]",
                    violationCount === 0
                      ? "text-green-600"
                      : violationCount < 3
                      ? "text-yellow-600"
                      : "text-red-600"
                  )}
                >
                  {violationCount} detected
                </p>
              </div>
            </div>
          </div>

          {/* Camera Preview */}
          <div>
            <p className="text-xs font-medium mb-2">Camera Monitor</p>
            <FaceDetection
              enabled={isActive}
              onFaceCountChange={onFaceCountChange}
              onViolation={onViolation}
            />
          </div>

          {/* Recent Events */}
          {events.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-2">Recent Events</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {events
                  .slice(-5)
                  .reverse()
                  .map((event, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2 rounded bg-gray-50 text-xs"
                    >
                      {getSeverityIcon(event.severity)}
                      <div className="flex-1">
                        <p className="font-medium">{event.type}</p>
                        <p className="text-gray-600">{event.description}</p>
                        <p className="text-[10px] text-gray-400">
                          {formatTime(event.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Fullscreen Button */}
          {!isFullscreen && (
            <button
              onClick={onEnterFullscreen}
              className="w-full flex items-center justify-center gap-2 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Maximize className="w-4 h-4" />
              <span>Enter Fullscreen</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
