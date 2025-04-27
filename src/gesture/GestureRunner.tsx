/**
 * GestureRunner.tsx
 * 
 * This component shows the webcam feed and listens for hand gestures in real-time.
 * 
 * What it does:
 * - Starts the webcam when `isActive` is true
 * - Detects hand gestures using TensorFlow and MediaPipe
 * - Calls the `onGesture()` callback when a gesture is found
 * 
 * Gestures it can detect:
 * - "thumbs_up"
 * - "thumbs_down"
 * - "flat_hand"
 * 
 * Used in: FlashcardReview.tsx (gesture mode)
 */


import React, { useEffect, useRef } from "react";
import { initGestureRecognition } from "./gestureRecognition";

type Gesture = "thumbs_up" | "thumbs_down" | "flat_hand";

interface Props {
  isActive: boolean;
  onGesture: (g: Gesture) => void;
  detectorRef?: React.MutableRefObject<any>;
  width?: number;   // display width  (default 640)
  height?: number;  // display height (default 420)
}

export const GestureRunner: React.FC<Props> = ({
  isActive,
  onGesture,
  detectorRef,
  width = 640,
  height = 420,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorInternalRef = useRef<any>(null);

  /* --- keep a stable callback so detector isn't restarted every re-render --- */
  const cbRef = useRef(onGesture);
  useEffect(() => {
    cbRef.current = onGesture;
  }, [onGesture]);

  /* --- start / stop detector (runs only when isActive toggles) --- */
  useEffect(() => {
    if (!isActive || !videoRef.current || !canvasRef.current) return;

    initGestureRecognition(
      videoRef.current,
      canvasRef.current,
      /* wrapper forwards to latest callback without re-init: */
      (g: Gesture) => cbRef.current(g),
    ).then(det => {
      detectorInternalRef.current = det;
      if (detectorRef) detectorRef.current = det;
    });

    return () => {
      detectorInternalRef.current?.stop?.();
      detectorInternalRef.current?.dispose?.();
    };
  }, [isActive]);               // ← only depends on isActive now

  /* --- once webcam knows its native resolution, scale canvas overlay --- */
  useEffect(() => {
    const videoEl = videoRef.current;
    const canvasEl = canvasRef.current;
    if (!videoEl || !canvasEl) return;

    const handleLoaded = () => {
      const vw = videoEl.videoWidth;   
      const vh = videoEl.videoHeight;
      if (!vw || !vh) return;

      const sx = width  / vw;          
      const sy = height / vh;

      const ctx = canvasEl.getContext("2d")!;
      ctx.setTransform(sx, 0, 0, sy, 0, 0); 
    };

    videoEl.addEventListener("loadedmetadata", handleLoaded);
    return () => videoEl.removeEventListener("loadedmetadata", handleLoaded);
  }, [width, height]);

  return (
    <div style={{ position: "relative", width, height }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        width={width}
        height={height}
        style={{
          transform: "scaleX(-1)",     
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0 }}
      />
    </div>
  );
};
