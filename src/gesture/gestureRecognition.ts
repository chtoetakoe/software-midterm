/**
 * gestureRecognition.ts
 * 
 * This file sets up the actual gesture detection using:
 * - TensorFlow.js
 * - MediaPipe Hands
 * 
 * It watches the webcam feed, detects hand landmarks,
 * and figures out what gesture is being shown (like thumbs up).
 * 
 * It also draws a hand skeleton on a canvas for visualization.
 * 
 * Called by: GestureRunner.tsx
 */

 /** 
 * Initialize gesture recognition with a webcam stream
 * 
 * @param videoElement - The video element to use for webcam input
 * @param canvasElement - Optional canvas element for visualization
 * @param callback - Function to call when a gesture is detected
 * @param options - Configuration options
 * @returns A promise that resolves to the GestureDetector instance or null on failure
 */

import { GestureDetector, GestureType, GestureCallback } from './gestureDetection';

export async function initGestureRecognition(
  videoElement: HTMLVideoElement,
  canvasElement?: HTMLCanvasElement,
  callback?: GestureCallback,
  options = {}
): Promise<GestureDetector | null> {
  try {
    const detector = new GestureDetector(options);
    const success = await detector.initialize(videoElement, canvasElement, callback);
    
    if (success) {
      detector.start();
      return detector;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to initialize gesture recognition:', error);
    return null;
  }
}

/**
 * Utility function to create and append video and canvas elements to a container
 * 
 * @param container - The container element
 * @param width - Desired width of the video/canvas
 * @param height - Desired height of the video/canvas
 * @returns Object containing the created video and canvas elements
 */
export function createMediaElements(
  container: HTMLElement,
  width = 640,
  height = 480
): { video: HTMLVideoElement; canvas: HTMLCanvasElement } {
  // Create video element
  const video = document.createElement('video');
  video.width = width;
  video.height = height;
  video.style.position = 'absolute';
  video.style.zIndex = '1';
  video.muted = true;
  video.playsInline = true;
  
  // Create canvas for hand visualization
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.position = 'absolute';
  canvas.style.zIndex = '2';
  
  // Style container
  container.style.position = 'relative';
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  
  // Add elements to container
  container.appendChild(video);
  container.appendChild(canvas);
  
  return { video, canvas };

  
}

