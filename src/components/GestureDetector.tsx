import React, { useRef, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlashcardDifficulty } from "@/types/flashcard";
import { gestureService } from "@/services/gesture-service";
import { Camera, Hand, ThumbsUp, ThumbsDown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  onGestureDetected: (g: FlashcardDifficulty) => void;
  isActive: boolean;
}

export const GestureDetector: React.FC<Props> = ({ onGestureDetected, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [detectedGesture, setDetectedGesture] = useState<FlashcardDifficulty | null>(null);
  const { toast } = useToast();

  const handleGestureDetected = (gesture: FlashcardDifficulty) => {
    setDetectedGesture(gesture);
    onGestureDetected(gesture);
  };

  /* initialise once */
  useEffect(() => {
    (async () => {
      if (videoRef.current && canvasRef.current) {
        const ok = await gestureService.init(videoRef.current, canvasRef.current, handleGestureDetected);
        if (ok) {
          setReady(true);
          toast({ title: "Gesture detection ready", description: "Show 👍 ✋ 👎 to rate" });
          if (isActive) gestureService.start();
        } else {
          toast({ 
            title: "Camera error", 
            description: "Please check your camera permissions and retry",
            variant: "destructive" 
          });
        }
      }
    })();
    return () => gestureService.stop();
  }, []);

  /* start / stop when tab changes */
  useEffect(() => {
    if (!ready) return;
    if (isActive) {
      gestureService.start();
    } else {
      gestureService.stop();
    }
  }, [isActive, ready]);

  // Helper function to get gesture icon
  const getGestureIcon = () => {
    switch (detectedGesture) {
      case FlashcardDifficulty.EASY:
        return <ThumbsUp className="h-6 w-6 text-green-500 mr-2" />;
      case FlashcardDifficulty.MEDIUM:
        return <Hand className="h-6 w-6 text-yellow-500 mr-2" />;
      case FlashcardDifficulty.HARD:
        return <ThumbsDown className="h-6 w-6 text-red-500 mr-2" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="overflow-hidden">
        <CardContent className="p-2 bg-black">
          <div className="relative aspect-video w-full">
          <video
  ref={videoRef}
  className="absolute inset-0 w-full h-full object-cover"
  playsInline
  muted
  style={{ transform: "scaleX(-1)" }} // ✅ Flip video to appear mirrored to user
/>

            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              width={640}
              height={480}
            />
          </div>
        </CardContent>
      </Card>

      {/* Detected gesture indicator */}
      {detectedGesture && (
        <div className="mt-3 p-2 bg-white border rounded-md shadow-sm flex items-center justify-center">
          {getGestureIcon()}
          <span className="font-medium">
            Detected: {detectedGesture}
          </span>
        </div>
      )}

      {!ready && (
        <div className="mt-4 text-center">
          <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
            <Camera size={16} className="mr-2" />
            Retry Camera
          </Button>
        </div>
      )}
    </div>
  );
};