
import React, { useRef, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlashcardDifficulty } from "@/types/flashcard";
import { gestureService } from "@/services/gesture-service";
import { ThumbsUp, ThumbsDown, Hand, Camera, KeyboardIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

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
  const [isLoading, setIsLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [detectedGesture, setDetectedGesture] = useState<FlashcardDifficulty | null>(null);
  const { toast } = useToast();
  
  // Handle gesture detection
  const handleGestureDetected = (difficulty: FlashcardDifficulty) => {
    setDetectedGesture(difficulty);
    onGestureDetected(difficulty);
    
    // Show gesture toast
    toast({
      title: `Gesture detected: ${difficulty.toLowerCase()}`,
      description: "Card has been rated based on your gesture",
    });
    
    // Reset the detected gesture after a short time
    setTimeout(() => {
      setDetectedGesture(null);
    }, 2000);
  };
  
  // Initialize gesture detection
  useEffect(() => {
    let mounted = true;
    
    const initGestureDetection = async () => {
      setIsLoading(true);
      
      if (videoRef.current && canvasRef.current) {
        try {
          // Initialize the gesture service
          const success = await gestureService.initialize(
            videoRef.current,
            canvasRef.current,
            handleGestureDetected
          );
          
          if (mounted) {
            setInitialized(success);
            setUsingFallback(!success);
            setIsLoading(false);
            
            if (success && isActive) {
              gestureService.start();
            }
            
            // Show appropriate toast
            if (success) {
              toast({
                title: "Gesture detection enabled",
                description: "Use hand gestures to rate flashcards",
              });
            } else {
              toast({
                title: "Using keyboard fallback",
                description: "Press E (Easy), M (Medium), or H (Hard)",
                variant: "destructive"
              });
            }
          }
        } catch (error) {
          console.error("Error initializing gesture service:", error);
          if (mounted) {
            setInitialized(false);
            setUsingFallback(true);
            setIsLoading(false);
            
            toast({
              title: "Gesture detection failed",
              description: "Using keyboard controls as fallback",
              variant: "destructive"
            });
          }
        }
      }
    };
    
    initGestureDetection();
    
    return () => {
      mounted = false;
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
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <p className="text-white">Loading gesture detection...</p>
              </div>
            )}
            
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
            <div className="gesture-overlay absolute inset-0 flex items-center justify-center pointer-events-none">
              {detectedGesture === FlashcardDifficulty.EASY && (
                <ThumbsUp className="w-32 h-32 text-green-500 animate-pulse" />
              )}
              {detectedGesture === FlashcardDifficulty.MEDIUM && (
                <Hand className="w-32 h-32 text-yellow-500 animate-pulse" />
              )}
              {detectedGesture === FlashcardDifficulty.HARD && (
                <ThumbsDown className="w-32 h-32 text-red-500 animate-pulse" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {!initialized && !isLoading ? (
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            {usingFallback 
              ? "Using keyboard controls due to camera access issues" 
              : "Camera access required for gesture detection"}
          </p>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
          >
            <Camera size={16} />
            <span>Retry Camera Access</span>
          </Button>
        </div>
      ) : (
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground mb-2 flex items-center justify-center gap-1">
            {usingFallback 
              ? (
                <>
                  <KeyboardIcon size={14} className="inline" />
                  <span>Using keyboard controls (E/M/H keys)</span>
                </>
              ) 
              : (
                <>
                  <Camera size={14} className="inline" />
                  <span>{isActive 
                    ? "Show gestures to rate card or use buttons below" 
                    : "Gesture detection paused"}</span>
                </>
              )}
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
