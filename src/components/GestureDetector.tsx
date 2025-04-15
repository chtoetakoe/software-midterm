
import React, { useRef, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlashcardDifficulty } from "@/types/flashcard";
import { gestureService } from "@/services/gesture-service";
import { ThumbsUp, ThumbsDown, Hand } from "lucide-react";
import { cn } from "@/lib/utils";

interface GestureDetectorProps {
  onGestureDetected: (difficulty: FlashcardDifficulty) => void;
  isActive: boolean;
}

export const GestureDetector: React.FC<GestureDetectorProps> = ({
  onGestureDetected,
  isActive
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [initialized, setInitialized] = useState(false);
  const [detectedGesture, setDetectedGesture] = useState<FlashcardDifficulty | null>(null);
  
  // Initialize gesture detection
  useEffect(() => {
    const initGestureDetection = async () => {
      if (videoRef.current && canvasRef.current) {
        const success = await gestureService.initialize(
          videoRef.current,
          canvasRef.current,
          handleGestureDetected
        );
        if (success) {
          setInitialized(true);
        }
      }
    };
    
    initGestureDetection();
    
    return () => {
      gestureService.stop();
    };
  }, []);
  
  // Start/stop detection based on active state
  useEffect(() => {
    if (initialized) {
      if (isActive) {
        gestureService.start();
      } else {
        gestureService.stop();
      }
    }
  }, [isActive, initialized]);
  
  const handleGestureDetected = (difficulty: FlashcardDifficulty) => {
    setDetectedGesture(difficulty);
    onGestureDetected(difficulty);
    
    // Reset the detected gesture after a short time
    setTimeout(() => {
      setDetectedGesture(null);
    }, 2000);
  };
  
  // For demo purposes, add buttons to simulate gestures
  const simulateGesture = (difficulty: FlashcardDifficulty) => {
    if (isActive) {
      gestureService.simulateGestureDetection(difficulty);
    }
  };

  return (
    <div className="gesture-detector-container w-full max-w-md mx-auto">
      <Card className="overflow-hidden">
        <CardContent className="p-2 bg-black">
          <div className="relative aspect-video w-full">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              width={640}
              height={480}
            />
            
            {/* Gesture indicator overlay */}
            <div className="gesture-overlay">
              {detectedGesture === FlashcardDifficulty.EASY && (
                <ThumbsUp className="gesture-icon visible text-green-500" />
              )}
              {detectedGesture === FlashcardDifficulty.MEDIUM && (
                <Hand className="gesture-icon visible text-yellow-500" />
              )}
              {detectedGesture === FlashcardDifficulty.HARD && (
                <ThumbsDown className="gesture-icon visible text-red-500" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {!initialized ? (
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Camera access required for gesture detection
          </p>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
          >
            Enable Camera
          </Button>
        </div>
      ) : (
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            {isActive 
              ? "Show gestures to rate card or use buttons below" 
              : "Gesture detection paused"}
          </p>
          <div className={cn("flex justify-center gap-2", !isActive && "opacity-50 pointer-events-none")}>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => simulateGesture(FlashcardDifficulty.EASY)}
              className="flex items-center gap-1"
            >
              <ThumbsUp size={16} className="text-green-500" />
              <span>Easy</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => simulateGesture(FlashcardDifficulty.MEDIUM)}
              className="flex items-center gap-1"
            >
              <Hand size={16} className="text-yellow-500" />
              <span>Medium</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => simulateGesture(FlashcardDifficulty.HARD)}
              className="flex items-center gap-1"
            >
              <ThumbsDown size={16} className="text-red-500" />
              <span>Hard</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
