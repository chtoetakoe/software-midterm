import { useEffect, useRef } from "react";
import { initGestureRecognition } from "./gestureRecognition";

interface Props {
  isActive: boolean;
  onGesture: (gesture: "thumbs_up" | "thumbs_down" | "flat_hand") => void;
  detectorRef?: React.MutableRefObject<any>;
}

export const GestureRunner: React.FC<Props> = ({ isActive, onGesture, detectorRef }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const internalDetectorRef = useRef<any>(null);

  useEffect(() => {
    if (isActive && videoRef.current) {
      initGestureRecognition(videoRef.current, canvasRef.current!, onGesture).then((detector) => {
        internalDetectorRef.current = detector;
        if (detectorRef) detectorRef.current = detector;
      });
    }

    return () => {
      internalDetectorRef.current?.stop();
      internalDetectorRef.current?.dispose?.();
    };
  }, [isActive]);

  return (
    <div style={{ position: "relative", width: 640, height: 480 }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        width={640}
        height={480}
        style={{ transform: "scaleX(-1)", position: "absolute", top: 0, left: 0 }}
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{ position: "absolute", top: 0, left: 0 }}
      />
    </div>
  );
};
