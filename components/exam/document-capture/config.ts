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
  stabilityDuration: 600,
  stabilityDecay: 0.2,  // Decrement 20% per failed frame instead of reset to 0

  // Capture quality
  jpegQuality: 1.0,
  // Portrait orientation for mobile (3:4 aspect ratio) - height > width
  idealWidth: 2880,
  idealHeight: 2160,

  // QR Detection
  qrRoiRatio: 0.5,          // 50% of frame for QR ROI (top-left quadrant)
  qrWarningDelayMs: 1000,   // 1s before showing "no QR" warning
  qrMaxAttempts: 5,         // 1000ms / 200ms = 5 frames

  // Sharpness (Laplacian variance) - from OMR service calibration
  sharpnessThreshold: 70,  // variance below this = blurry (lowered for low-end devices)
} as const;

export type DocumentCaptureConfig = typeof DOCUMENT_CAPTURE_CONFIG;
