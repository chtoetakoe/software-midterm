import { useEffect, useRef } from "react";
import { initGestureRecognition } from "./gestureRecognition";

interface Props {
  isActive: boolean;
  onGesture: (g: "thumbs_up" | "thumbs_down" | "flat_hand") => void;
  detectorRef?: React.MutableRefObject<any>;
  width?: number;   // NEW
  height?: number;  // NEW
}

export const GestureRunner: React.FC<Props> = ({
  isActive, onGesture, detectorRef, width = 640, height = 420,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const internalDetectorRef = useRef<any>(null);

  useEffect(() => {
    if (isActive && videoRef.current) {
      initGestureRecognition(videoRef.current, canvasRef.current!, onGesture).then(det => {
        internalDetectorRef.current = det;
        if (detectorRef) detectorRef.current = det;
      });
    }
    return () => {
      internalDetectorRef.current?.stop();
      internalDetectorRef.current?.dispose?.();
    };
  }, [isActive]);

  return (
    <div style={{ position: "relative", width, height }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        width={width}
        height={height}
        style={{ transform: "scaleX(-1)", position: "absolute", top: 0, left: 0 }}
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
