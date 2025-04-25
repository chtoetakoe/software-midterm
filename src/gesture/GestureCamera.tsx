
import { useEffect, useRef, useState } from 'react';
import { initGestureRecognition } from '../gesture/gestureRecognition';
import { GestureType } from '../gesture/gestureDetection';
import { toast } from '@/hooks/use-toast';

interface GestureCameraProps {
  onGestureDetected: (gesture: GestureType) => void;
  isRunning: boolean; // Add this prop to control camera from parent
}

export const GestureCamera = ({ onGestureDetected, isRunning }: GestureCameraProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const detectorRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Start the webcam and detection based on isRunning prop
  useEffect(() => {
    if (isRunning) {
      startDetection();
    } else {
      stopDetection();
    }
    
    // Cleanup on unmount
    return () => {
      stopDetection().catch(err => {
        console.error('Error cleaning up:', err);
      });
    };
  }, [isRunning]); // React to changes in isRunning prop

  // Start the webcam and detection
  const startDetection = async () => {
    if (!containerRef.current) return;
    
    try {
      setError(null);
      
      // Stop any existing detection first
      await stopDetection();
      
      // Create video element
      const video = document.createElement('video');
      video.width = 640;
      video.height = 480;
      video.style.position = 'absolute';
      video.style.zIndex = '1';
      video.muted = true;
      video.playsInline = true;
      videoRef.current = video;
      
      // Create canvas for hand visualization
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      canvas.style.position = 'absolute';
      canvas.style.zIndex = '2';
      canvasRef.current = canvas;
      
      // Add elements to container
      if (containerRef.current) {
        containerRef.current.appendChild(video);
        containerRef.current.appendChild(canvas);
      }
      
      const detector = await initGestureRecognition(
        video,
        canvas,
        onGestureDetected,
        { minConfidence: 0.7, maxHands: 1 }
      );
      
      if (detector) {
        detectorRef.current = detector;
        toast({
          title: "Camera started",
          description: "Hand gesture detection is now active"
        });
      } else {
        setError('Failed to initialize gesture detection');
      }
    } catch (err) {
      console.error('Error starting detection:', err);
      setError('Error initializing webcam or gesture detection');
    }
  };

  // Stop detection and clean up
  const stopDetection = async () => {
    try {
      if (detectorRef.current) {
        await detectorRef.current.dispose();
        detectorRef.current = null;
      }
      
      // Clean up DOM elements safely
      if (videoRef.current && videoRef.current.parentNode) {
        videoRef.current.parentNode.removeChild(videoRef.current);
        videoRef.current = null;
      }
      
      if (canvasRef.current && canvasRef.current.parentNode) {
        canvasRef.current.parentNode.removeChild(canvasRef.current);
        canvasRef.current = null;
      }
    } catch (err) {
      console.error('Error stopping detection:', err);
    }
  };

  return (
    <div className="text-center">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className="w-[640px] h-[480px] relative bg-black rounded-lg overflow-hidden"
      >
        {!isRunning && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
            <p>Camera is off</p>
          </div>
        )}
      </div>
    </div>
  );
};
