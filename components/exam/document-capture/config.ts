/**
 * Document Capture - Configuration
 *
 * Calibrated for exam sheet detection.
 * Last calibration: December 2024
 */

export const DOCUMENT_CAPTURE_CONFIG = {
  // Processing
  processIntervalMs: 200,
  processWidth: 640,
  processHeight: 480,

  // Adaptive threshold
  adaptiveBlockSize: 23,
  adaptiveC: 10,
  blurKernel: 5,
  dilateIterations: 1,

  // Contour detection
  minAreaRatio: 0.1,
  maxAreaRatio: 0.95,
  approxEpsilon: 0.02,

  // Stability
  stabilityDuration: 800,

  // Capture quality
  jpegQuality: 0.95,
  // Portrait orientation for mobile (3:4 aspect ratio) - height > width
  idealWidth: 2880,
  idealHeight: 2160,
} as const;

export type DocumentCaptureConfig = typeof DOCUMENT_CAPTURE_CONFIG;
