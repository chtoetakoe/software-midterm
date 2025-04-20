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

  constructor() {
    this.initKeyboardControls();
  }

  private initKeyboardControls() {
    document.addEventListener('keydown', (event) => {
      if (!this.isRunning || !this.onGestureDetected) return;
      switch (event.key.toLowerCase()) {
        case 'e':
          this.onGestureDetected(FlashcardDifficulty.EASY);
          break;
        case 'm':
          this.onGestureDetected(FlashcardDifficulty.MEDIUM);
          break;
        case 'h':
          this.onGestureDetected(FlashcardDifficulty.HARD);
          break;
      }
    });
  }

  async init(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    onGestureDetected: (gesture: FlashcardDifficulty) => void
  ): Promise<boolean> {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.onGestureDetected = onGestureDetected;

    try {
      await tf.setBackend('webgl');

      this.detector = await handPoseDetection.createDetector(
        handPoseDetection.SupportedModels.MediaPipeHands,
        {
          runtime: 'tfjs',
          modelType: 'lite',
          maxHands: 1
        }
      );

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 }
      });

      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        this.videoElement.playsInline = true;
        this.videoElement.muted = true;
        await this.videoElement.play();
      }

      return true;
    } catch (err) {
      console.error("GestureService init failed:", err);
      return false;
    }
  }

  async start(): Promise<void> {
    if (this.isRunning || !this.detector) return;
    this.isRunning = true;

    this.detectionInterval = window.setInterval(() => {
      this.detect();
    }, 100);
  }

  stop(): void {
    this.isRunning = false;
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  private async detect() {
    if (!this.detector || !this.videoElement || !this.canvasElement) return;

    const hands = await this.detector.estimateHands(this.videoElement);
    const ctx = this.canvasElement.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(-1, 1); // flip canvas horizontally
    ctx.clearRect(-this.canvasElement.width, 0, this.canvasElement.width, this.canvasElement.height);
    ctx.drawImage(this.videoElement, -this.canvasElement.width, 0, this.canvasElement.width, this.canvasElement.height);
    ctx.restore();

    if (hands.length > 0) {
      const hand = hands[0];
      const gesture = this.recognize(hand.keypoints);
      if (gesture && this.onGestureDetected) {
        const now = Date.now();
        if (now - this.lastGestureTime > 1000) {
          this.lastGestureTime = now;
          this.lastDetectedGesture = gesture;
          this.onGestureDetected(gesture);
        }
      }
    }
  }

  private recognize(keypoints: handPoseDetection.Keypoint[]): FlashcardDifficulty | null {
    if (keypoints.length < 21) return null;

    const wrist = keypoints.find(k => k.name === 'wrist');
    const thumbTip = keypoints.find(k => k.name === 'thumb_tip');
    const indexTip = keypoints.find(k => k.name === 'index_finger_tip');
    const middleTip = keypoints.find(k => k.name === 'middle_finger_tip');

    if (!wrist || !thumbTip || !indexTip || !middleTip) return null;

    // Thumb Up
    if (thumbTip.y < wrist.y - 50 && Math.abs(thumbTip.x - wrist.x) < 50) {
      return FlashcardDifficulty.EASY;
    }

    // Thumb Down
    if (thumbTip.y > wrist.y + 50 && Math.abs(thumbTip.x - wrist.x) < 50) {
      return FlashcardDifficulty.HARD;
    }

    // Flat hand (horizontal fingers)
    const tips = keypoints.filter(k => k.name?.includes('_tip'));
    const ySpread = Math.max(...tips.map(k => k.y)) - Math.min(...tips.map(k => k.y));
    if (ySpread < 30) {
      return FlashcardDifficulty.MEDIUM;
    }

    return null;
  }

  simulateGestureDetection(gesture: FlashcardDifficulty): void {
    if (!this.isRunning || !this.onGestureDetected) return;
    this.onGestureDetected(gesture);
  }
}

export const gestureService = new GestureService();