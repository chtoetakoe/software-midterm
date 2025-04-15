
import { FlashcardDifficulty } from "../types/flashcard";
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';

export class GestureService {
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private stream: MediaStream | null = null;
  private isRunning = false;
  private onGestureDetected: ((gesture: FlashcardDifficulty) => void) | null = null;
  private detector: handPoseDetection.HandDetector | null = null;
  private lastDetectedGesture: FlashcardDifficulty | null = null;
  private lastGestureTime = 0;
  private detectionInterval: number | null = null;
  
  // For demo purposes, we'll use keyboard controls to simulate gestures as fallback
  private initKeyboardControls() {
    document.addEventListener('keydown', (event) => {
      if (!this.isRunning || !this.onGestureDetected) return;
      
      switch (event.key) {
        case 'e':
        case 'E':
          this.onGestureDetected(FlashcardDifficulty.EASY);
          break;
        case 'm':
        case 'M':
          this.onGestureDetected(FlashcardDifficulty.MEDIUM);
          break;
        case 'h':
        case 'H':
          this.onGestureDetected(FlashcardDifficulty.HARD);
          break;
      }
    });
  }
  
  constructor() {
    this.initKeyboardControls();
  }
  
  async initialize(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    onGestureDetected: (gesture: FlashcardDifficulty) => void
  ): Promise<boolean> {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.onGestureDetected = onGestureDetected;
    
    try {
      // Set backend to WebGL for better performance
      await tf.setBackend('webgl');
      console.log("TensorFlow backend set to:", tf.getBackend());
      
      // Load the handpose detection model
      const model = handPoseDetection.SupportedModels.MediaPipeHands;
      const detectorConfig = {
        runtime: 'tfjs', // or 'mediapipe'
        modelType: 'lite',
        maxHands: 1
      } as const;
      
      console.log("Loading hand pose detection model...");
      this.detector = await handPoseDetection.createDetector(
        model, 
        detectorConfig
      );
      console.log("Hand pose detection model loaded successfully");
      
      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      
      // Set up video
      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        this.videoElement.playsInline = true;
        this.videoElement.muted = true;
        await this.videoElement.play();
      }
      
      console.log("Gesture detection initialized successfully");
      return true;
    } catch (error) {
      console.error("Error initializing gesture detection:", error);
      // Fall back to keyboard controls
      console.log("Falling back to keyboard controls (E/M/H keys)");
      
      // Show error message in canvas
      if (this.canvasElement) {
        const ctx = this.canvasElement.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
          ctx.font = '16px Arial';
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.fillText('Camera access error. Using keyboard fallback.', this.canvasElement.width / 2, 30);
          ctx.fillText('Press E for Easy, M for Medium, H for Hard', this.canvasElement.width / 2, 60);
        }
      }
      
      return false;
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    
    if (!this.detector) {
      // Show fallback message in canvas
      if (this.canvasElement) {
        const ctx = this.canvasElement.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
          ctx.font = '16px Arial';
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.fillText('Using keyboard controls:', this.canvasElement.width / 2, 30);
          ctx.fillText('Press E for Easy, M for Medium, H for Hard', this.canvasElement.width / 2, 60);
        }
      }
      return;
    }
    
    // Start detection loop
    console.log("Starting hand pose detection loop");
    this.detectionInterval = window.setInterval(async () => {
      await this.detectHandPose();
    }, 100); // Run detection every 100ms
  }
  
  private async detectHandPose(): Promise<void> {
    if (!this.detector || !this.videoElement || !this.canvasElement || !this.isRunning) return;
    
    try {
      // Detect hand landmarks
      const hands = await this.detector.estimateHands(this.videoElement);
      
      // Draw video feed and landmarks on canvas
      const ctx = this.canvasElement.getContext('2d');
      if (ctx) {
        // Draw video feed
        ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        ctx.drawImage(
          this.videoElement, 
          0, 0, 
          this.canvasElement.width, 
          this.canvasElement.height
        );
        
        // Process and visualize hands
        if (hands.length > 0) {
          const hand = hands[0];
          
          // Draw landmarks
          this.drawLandmarks(ctx, hand.keypoints);
          
          // Detect gesture
          const gesture = this.recognizeGesture(hand.keypoints);
          if (gesture && this.onGestureDetected) {
            // Debounce to avoid rapid firing of gestures
            const now = Date.now();
            if (now - this.lastGestureTime > 1000) { // 1 second debounce
              this.lastGestureTime = now;
              this.lastDetectedGesture = gesture;
              this.onGestureDetected(gesture);
              
              // Display detected gesture
              ctx.font = '24px Arial';
              ctx.fillStyle = 'white';
              ctx.textAlign = 'center';
              ctx.fillText(`Detected: ${gesture}`, this.canvasElement.width / 2, 30);
            }
          }
        }
        
        // Always show instructions
        ctx.font = '16px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('👍 = Easy, ✋ = Medium, 👎 = Hard', this.canvasElement.width / 2, this.canvasElement.height - 20);
      }
    } catch (error) {
      console.error("Error in hand detection:", error);
    }
  }
  
  private drawLandmarks(ctx: CanvasRenderingContext2D, keypoints: handPoseDetection.Keypoint[]): void {
    // Draw connections between landmarks (simplified)
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    
    // Draw dots for all landmarks
    keypoints.forEach(point => {
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
      ctx.fill();
    });
  }
  
  private recognizeGesture(keypoints: handPoseDetection.Keypoint[]): FlashcardDifficulty | null {
    if (keypoints.length < 21) return null;
    
    // Get thumb tip, index tip and palm positions
    const thumbTip = keypoints.find(kp => kp.name === 'thumb_tip');
    const indexTip = keypoints.find(kp => kp.name === 'index_finger_tip');
    const middleTip = keypoints.find(kp => kp.name === 'middle_finger_tip');
    const wrist = keypoints.find(kp => kp.name === 'wrist');
    
    if (!thumbTip || !indexTip || !middleTip || !wrist) return null;
    
    // Simple gesture detection based on relative positions
    
    // Thumbs up: thumb tip is above wrist
    if (thumbTip.y < wrist.y - 50 && Math.abs(thumbTip.x - wrist.x) < 50) {
      return FlashcardDifficulty.EASY;
    }
    
    // Thumbs down: thumb tip is below wrist
    if (thumbTip.y > wrist.y + 50 && Math.abs(thumbTip.x - wrist.x) < 50) {
      return FlashcardDifficulty.HARD;
    }
    
    // Flat hand: fingers are roughly aligned horizontally
    const fingerTips = keypoints.filter(kp => kp.name?.includes('_tip'));
    if (fingerTips.length >= 4) {
      const yPositions = fingerTips.map(tip => tip.y);
      const maxYDiff = Math.max(...yPositions) - Math.min(...yPositions);
      if (maxYDiff < 30) {
        return FlashcardDifficulty.MEDIUM;
      }
    }
    
    return null;
  }
  
  stop(): void {
    this.isRunning = false;
    
    // Clear detection interval
    if (this.detectionInterval !== null) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
    
    // Stop the camera stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    console.log("Gesture detection stopped");
  }
  
  // Simulation method for testing
  simulateGestureDetection(gesture: FlashcardDifficulty): void {
    if (!this.isRunning || !this.onGestureDetected) return;
    this.onGestureDetected(gesture);
  }
}

export const gestureService = new GestureService();
