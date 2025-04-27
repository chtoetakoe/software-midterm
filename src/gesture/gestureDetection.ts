/**
 * gestureDetection.ts
 * 
 * This file contains the logic to classify a detected hand
 * into one of the gestures:
 * - "thumbs_up"
 * - "thumbs_down"
 * - "flat_hand"
 * - "unknown"
 * 
 * It uses the hand landmarks (positions of fingers) to decide
 * which gesture is being made.
 * 
 * Used by: gestureRecognition.ts
 */


import * as tf from '@tensorflow/tfjs';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';

// List of gesture types the app recognizes
export type GestureType = 'thumbs_up' | 'thumbs_down' | 'flat_hand' | 'unknown';

export type GestureCallback = (gesture: GestureType) => void;

export interface GestureDetectionConfig {
  minConfidence?: number;
  maxHands?: number;
}

export class GestureDetector {
  private detector: handPoseDetection.HandDetector | null = null;
  private video: HTMLVideoElement | null = null;
  private isRunning = false;
  private callback: GestureCallback | null = null;
  private config: Required<GestureDetectionConfig>;
  private canvasElement: HTMLCanvasElement | null = null;
  private canvasCtx: CanvasRenderingContext2D | null = null;

  private lastGesture: GestureType = 'unknown';
  private lastGestureTime = 0;

  constructor(config: GestureDetectionConfig = {}) {
    this.config = {
      minConfidence: config.minConfidence ?? 0.7,
      maxHands: config.maxHands ?? 1,
    };
  }

  public async initialize(
    videoElement: HTMLVideoElement,
    canvasElement?: HTMLCanvasElement,
    callback?: GestureCallback
  ): Promise<boolean> {
    try {
      await tf.ready();

      const model = handPoseDetection.SupportedModels.MediaPipeHands;
      const detectorConfig: handPoseDetection.MediaPipeHandsTfjsModelConfig = {
        runtime: 'tfjs',
        modelType: 'full',
        maxHands: this.config.maxHands,
      };

      this.detector = await handPoseDetection.createDetector(model, detectorConfig);
      this.video = videoElement;
      this.callback = callback || null;

      if (canvasElement) {
        this.canvasElement = canvasElement;
        this.canvasCtx = canvasElement.getContext('2d');
      }

      if (!this.video.srcObject) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        });

        this.video.srcObject = stream;

        await new Promise<void>((resolve) => {
          this.video!.onloadedmetadata = () => resolve();
        });

        await this.video.play();

        if (this.canvasElement) {
          this.canvasElement.width = this.video.videoWidth;
          this.canvasElement.height = this.video.videoHeight;
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize gesture detector:', error);
      return false;
    }
  }

  public start(callback?: GestureCallback): void {
    if (callback) {
      this.callback = callback;
    }
    if (!this.detector || !this.video || this.isRunning) return;
    this.isRunning = true;
    this.detectFrame();
  }

  public stop(): void {
    this.isRunning = false;
  }

  public async dispose(): Promise<void> {
    this.stop();
    if (this.detector) {
      await this.detector.dispose();
      this.detector = null;
    }

    if (this.video && this.video.srcObject) {
      const stream = this.video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      this.video.srcObject = null;
    }
  }

  private async detectFrame(): Promise<void> {
    if (!this.isRunning || !this.detector || !this.video) return;

    try {
      const hands = await this.detector.estimateHands(this.video);

      if (hands && hands.length > 0) {
        for (const hand of hands) {
          if (hand.score && hand.score < this.config.minConfidence) continue;

          const gesture = this.recognizeGesture(hand);
          this.lastGesture = gesture;
          this.lastGestureTime = Date.now();

          if (this.canvasCtx && this.canvasElement) {
            this.drawHand(hand);
            this.drawGestureLabel(gesture);
          }

          if (this.callback) {
            
            this.callback(gesture);
          }
        }
      } else if (this.canvasCtx && this.canvasElement) {
        const timeSinceLast = Date.now() - this.lastGestureTime;

        if (timeSinceLast < 1000) {
          this.drawGestureLabel(this.lastGesture);
        } else {
          this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        }
      }
    } catch (error) {
      console.error('Error during hand detection:', error);
    }

    requestAnimationFrame(() => this.detectFrame());
  }

  private drawHand(hand: handPoseDetection.Hand): void {
    if (!this.canvasCtx || !this.canvasElement || !hand.keypoints) return;

    const ctx = this.canvasCtx;

    ctx.save();
    ctx.translate(this.canvasElement.width, 0);
    ctx.scale(-1, 1);

    ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

    const fingerConnections = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [0, 9], [9, 10], [10, 11], [11, 12],
      [0, 13], [13, 14], [14, 15], [15, 16],
      [0, 17], [17, 18], [18, 19], [19, 20],
      [0, 5], [5, 9], [9, 13], [13, 17],
    ];

    ctx.strokeStyle = '#FF9800';
    ctx.lineWidth = 2;

    for (const [i, j] of fingerConnections) {
      const kp1 = hand.keypoints[i];
      const kp2 = hand.keypoints[j];
      if (kp1 && kp2) {
        ctx.beginPath();
        ctx.moveTo(kp1.x, kp1.y);
        ctx.lineTo(kp2.x, kp2.y);
        ctx.stroke();
      }
    }

    for (const keypoint of hand.keypoints) {
      ctx.beginPath();
      ctx.arc(keypoint.x, keypoint.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawGestureLabel(gesture: GestureType): void {
    if (!this.canvasCtx || !this.canvasElement) return;

    const ctx = this.canvasCtx;

    ctx.save();
    ctx.translate(this.canvasElement.width, 0);
    ctx.scale(-1, 1);

    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.font = '20px Arial';
    ctx.fillText(gesture, 10, 30);
    ctx.strokeText(gesture, 10, 30);

    ctx.restore();
  }

  public recognizeGesture(hand: handPoseDetection.Hand): GestureType {
    if (!hand.keypoints || hand.keypoints.length < 21) return 'unknown';

    const thumb = { base: hand.keypoints[1], tip: hand.keypoints[4] };
    const index = { base: hand.keypoints[5], tip: hand.keypoints[8] };
    const middle = { base: hand.keypoints[9], tip: hand.keypoints[12] };
    const ring = { base: hand.keypoints[13], tip: hand.keypoints[16] };
    const pinky = { base: hand.keypoints[17], tip: hand.keypoints[20] };

    if (
      thumb.tip.y < thumb.base.y - 30 &&
      index.tip.y > index.base.y &&
      middle.tip.y > middle.base.y &&
      ring.tip.y > ring.base.y &&
      pinky.tip.y > pinky.base.y
    ) return 'thumbs_up';

    if (
      thumb.tip.y > thumb.base.y + 30 &&
      index.tip.y > index.base.y &&
      middle.tip.y > middle.base.y &&
      ring.tip.y > ring.base.y &&
      pinky.tip.y > pinky.base.y
    ) return 'thumbs_down';

    if (
      index.tip.y < index.base.y &&
      middle.tip.y < middle.base.y &&
      ring.tip.y < ring.base.y &&
      pinky.tip.y < pinky.base.y &&
      Math.abs(index.tip.y - middle.tip.y) < 30 &&
      Math.abs(middle.tip.y - ring.tip.y) < 30 &&
      Math.abs(ring.tip.y - pinky.tip.y) < 30
    ) return 'flat_hand';

    return 'unknown';
  }
}

