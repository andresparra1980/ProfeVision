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
  adaptiveBlockSize: 21,
  adaptiveC: 20,  // higher = less sensitive, more stable
  blurKernel: 5,
  dilateIterations: 1,

  // Contour detection
  minAreaRatio: 0.20,  // 20% min area
  maxAreaRatio: 0.95,
  approxEpsilon: 0.02,

  // Stability
  stabilityDuration: 800,

  // Capture quality
  jpegQuality: 0.95,
  // Portrait orientation for mobile (3:4 aspect ratio) - height > width
  idealWidth: 2880,
  idealHeight: 2160,

  // QR Detection
  qrRoiRatio: 0.5,          // 50% of frame for QR ROI (top-left quadrant)
  qrWarningDelayMs: 2000,   // 2s before showing "no QR" warning
  qrMaxAttempts: 10,        // 2000ms / 200ms = 10 frames

  // Sharpness (Laplacian variance) - from OMR service calibration
  sharpnessThreshold: 100,  // variance below this = blurry
} as const;

export type DocumentCaptureConfig = typeof DOCUMENT_CAPTURE_CONFIG;
