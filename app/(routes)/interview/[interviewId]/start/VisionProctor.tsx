"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { motion } from "motion/react";

interface VisionProctorProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  reportViolation: (type: string, severity: string, details?: string) => void;
  enabled: boolean;
  onPersonCountChange?: (count: number) => void;
}

const VisionProctor = ({ videoRef, reportViolation, enabled, onPersonCountChange }: VisionProctorProps) => {
  const [personCount, setPersonCount] = useState(1);
  const [scriptsLoaded, setScriptsLoaded] = useState({ face: false, camera: false });
  const lastViolationTime = useRef(0);
  const violationCooldown = 10000; // 10 seconds between same-type violations
  const instanceRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (onPersonCountChange) {
      onPersonCountChange(personCount);
    }
  }, [personCount, onPersonCountChange]);

  useEffect(() => {
    if (!enabled || !videoRef.current || !scriptsLoaded.face || !scriptsLoaded.camera) return;

    const FaceDetection = (window as any).FaceDetection;
    const Camera = (window as any).Camera;

    if (!FaceDetection || !Camera) {
      console.error("MediaPipe classes not found on window");
      return;
    }

    const faceDetection = new FaceDetection({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
      },
    });

    instanceRef.current = faceDetection;

    faceDetection.setOptions({
      model: "short",
      minDetectionConfidence: 0.5,
    });

    faceDetection.onResults((results: any) => {
      const count = results.detections.length;
      setPersonCount(count);

      const now = Date.now();
      if (now - lastViolationTime.current < violationCooldown) return;

      if (count === 0) {
        reportViolation("VISION_LOG", "HIGH", "No person detected in the camera frame.");
        lastViolationTime.current = now;
      } else if (count > 1) {
        reportViolation("VISION_LOG", "HIGH", `Multiple persons (${count}) detected in the camera frame.`);
        lastViolationTime.current = now;
      }
    });

    if (videoRef.current) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current && instanceRef.current) {
            await instanceRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });
      cameraRef.current = camera;
      camera.start();
    }

    return () => {
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch (e) {
          console.log("Error stopping VisionProctor camera:", e);
        }
      }
      if (instanceRef.current) {
        try {
          instanceRef.current.close();
        } catch (e) {
          console.log("Error closing VisionProctor instance:", e);
        }
      }
    };
  }, [enabled, videoRef, reportViolation, scriptsLoaded]);

  if (!enabled) return null;

  return (
    <>
      <Script 
        src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" 
        strategy="afterInteractive"
        onLoad={() => setScriptsLoaded(prev => ({ ...prev, camera: true }))}
      />
      <Script 
        src="https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js" 
        strategy="afterInteractive"
        onLoad={() => setScriptsLoaded(prev => ({ ...prev, face: true }))}
      />
    </>
  );
};

export default VisionProctor;
