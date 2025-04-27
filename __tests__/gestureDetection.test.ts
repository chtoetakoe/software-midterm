/// <reference types="vitest" />
import { expect, test } from "vitest";
import { _testUtils } from "../src/gesture/gestureDetection";

// Tests if a mock hand with the thumb raised and other fingers curled is recognized as "thumbs_up"
test("detects thumbs up", () => {
  const keypoints = Array(21).fill(null).map(() => ({ x: 0, y: 100 }));

  // thumb
  keypoints[1] = { x: 0, y: 80 };  // thumb base
  keypoints[4] = { x: 0, y: 40 };  // thumb tip → clearly above base by >30

  // index
  keypoints[5] = { x: 0, y: 60 };  // base
  keypoints[8] = { x: 0, y: 120 }; // tip → lower

  // middle
  keypoints[9] = { x: 0, y: 60 };
  keypoints[12] = { x: 0, y: 120 };

  // ring
  keypoints[13] = { x: 0, y: 60 };
  keypoints[16] = { x: 0, y: 120 };

  // pinky
  keypoints[17] = { x: 0, y: 60 };
  keypoints[20] = { x: 0, y: 120 };

  const mockHand = { keypoints };

  const result = _testUtils.recognizeGesture(mockHand);
  expect(result).toBe("thumbs_up");
});
