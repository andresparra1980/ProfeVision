'use client';

/**
 * DocumentCapture Component
 * 
 * Auto document capture using OpenCV.js with adaptive thresholding.
 * Includes QR validation to ensure exam belongs to current user.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2 } from 'lucide-react';
import jsQR from 'jsqr';
import { DOCUMENT_CAPTURE_CONFIG } from './config';
import type { DocumentCaptureProps, CaptureStatus, CaptureResult, ParsedQRData } from './types';
import { cn } from '@/lib/utils';

// OpenCV.js loader
let opencvLoadPromise: Promise<void> | null = null;

function loadOpenCV(): Promise<void> {
  if (opencvLoadPromise) return opencvLoadPromise;
  
  opencvLoadPromise = new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.cv?.getBuildInformation) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = `${window.location.origin}/opencv.js`;
    script.async = true;
    
    script.onload = () => {
      if (window.cv?.getBuildInformation) {
        resolve();
      } else {
        window.cv.onRuntimeInitialized = () => resolve();
      }
    };
    
    script.onerror = () => reject(new Error('Failed to load OpenCV.js'));
    document.head.appendChild(script);
  });
  
  return opencvLoadPromise;
}

const CONFIG = DOCUMENT_CAPTURE_CONFIG;

/**
 * Parse QR data string: examId:studentId:groupId:hash or examId:studentId:hash
 */
function parseQRData(qrString: string): ParsedQRData | null {
  if (!qrString) return null;
  
  const parts = qrString.split(':');
  if (parts.length === 3) {
    return { examId: parts[0], studentId: parts[1], hash: parts[2] };
  }
  if (parts.length === 4) {
    return { examId: parts[0], studentId: parts[1], groupId: parts[2], hash: parts[3] };
  }
  return null;
}

/**
 * Try to decode QR from a canvas region
 */
function decodeQRFromRegion(
  canvas: HTMLCanvasElement,
  x: number, y: number,
  w: number, h: number
): string | null {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  
  try {
    const imageData = ctx.getImageData(x, y, w, h);
    const qr = jsQR(imageData.data, w, h);
    return qr?.data || null;
  } catch {
    return null;
  }
}

/**
 * Search for QR in all quadrants (for manual capture fallback)
 */
function searchQRInAllQuadrants(canvas: HTMLCanvasElement): string | null {
  const w = canvas.width;
  const h = canvas.height;
  const halfW = Math.floor(w / 2);
  const halfH = Math.floor(h / 2);
  
  // Order: top-left, top-right, bottom-left, bottom-right, full image
  const regions = [
    { x: 0, y: 0, w: halfW, h: halfH },           // top-left
    { x: halfW, y: 0, w: halfW, h: halfH },       // top-right
    { x: 0, y: halfH, w: halfW, h: halfH },       // bottom-left
    { x: halfW, y: halfH, w: halfW, h: halfH },   // bottom-right
    { x: 0, y: 0, w, h },                          // full image
  ];
  
  for (const region of regions) {
    const qr = decodeQRFromRegion(canvas, region.x, region.y, region.w, region.h);
    if (qr) return qr;
  }
  
  return null;
}

export function DocumentCapture({
  onCapture,
  onError,
  onStatusChange,
  onCancel,
  className = '',
  showManualCapture = true,
  torchEnabled = false,
  bwEnabled = false,
}: DocumentCaptureProps) {
  const t = useTranslations('document-capture');
  const videoRef = useRef<HTMLVideoElement>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fullResCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [status, setStatus] = useState<CaptureStatus>('loading');
  const [statusMessage, setStatusMessage] = useState('');
  const [captured, setCaptured] = useState(false);
  
  const lastContourRef = useRef<{ area: number } | null>(null);
  const stableProgressRef = useRef(0);  // 0-100 progress percentage
  const noQrFrameCountRef = useRef(0);
  const lastQrDataRef = useRef<ParsedQRData | null>(null);
  
  // Store callbacks in refs to avoid dependency issues
  const onCaptureRef = useRef(onCapture);
  const onErrorRef = useRef(onError);
  const onStatusChangeRef = useRef(onStatusChange);
  
  useEffect(() => {
    onCaptureRef.current = onCapture;
    onErrorRef.current = onError;
    onStatusChangeRef.current = onStatusChange;
  }, [onCapture, onError, onStatusChange]);

  // Update status with callback
  const updateStatus = useCallback((newStatus: CaptureStatus, message: string) => {
    setStatus(newStatus);
    setStatusMessage(message);
    onStatusChangeRef.current?.(newStatus, message);
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Apply torch state when prop changes
  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;
    
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    
    // Check if torch is supported
    try {
      const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
      if (!capabilities.torch) return;
    } catch {
      return;
    }
    
    track.applyConstraints({
      advanced: [{ torch: torchEnabled } as MediaTrackConstraintSet]
    }).catch(err => {
      console.error('[DocumentCapture] Torch apply failed:', err);
    });
  }, [torchEnabled]);

  /**
   * Check image sharpness using Laplacian variance
   */
  const checkSharpness = useCallback((gray: unknown): number => {
    const cv = window.cv;
    if (!cv) return 0;
    
    try {
      const laplacian = new cv.Mat();
      cv.Laplacian(gray, laplacian, cv.CV_64F);
      
      const mean = new cv.Mat();
      const stddev = new cv.Mat();
      cv.meanStdDev(laplacian, mean, stddev);
      
      const variance = Math.pow(stddev.data64F[0], 2);
      
      laplacian.delete();
      mean.delete();
      stddev.delete();
      
      return variance;
    } catch {
      return CONFIG.sharpnessThreshold + 1; // Assume sharp on error
    }
  }, []);

  /**
   * Try to detect and validate QR from full resolution frame
   */
  const detectAndValidateQR = useCallback((): { valid: boolean; qrData: ParsedQRData | null; reason?: string } => {
    const video = videoRef.current;
    if (!video) return { valid: false, qrData: null };
    
    // Create or reuse full res canvas
    if (!fullResCanvasRef.current) {
      fullResCanvasRef.current = document.createElement('canvas');
    }
    const canvas = fullResCanvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { valid: false, qrData: null };
    
    ctx.drawImage(video, 0, 0);
    
    // Try top-left quadrant first (expected QR position)
    const roiW = Math.floor(canvas.width * CONFIG.qrRoiRatio);
    const roiH = Math.floor(canvas.height * CONFIG.qrRoiRatio);
    
    const qrString = decodeQRFromRegion(canvas, 0, 0, roiW, roiH);
    
    // If not found in top-left, don't search other quadrants during auto-detection
    // (manual capture will search all quadrants)
    if (!qrString) {
      return { valid: false, qrData: null };
    }
    
    const qrData = parseQRData(qrString);
    if (!qrData) {
      return { valid: false, qrData: null, reason: 'invalid_format' };
    }
    
    // Validation disabled - just check QR was parsed correctly
    return { valid: true, qrData };
  }, []);

  // Capture photo (with QR data)
  const capturePhoto = useCallback(async (qrData?: ParsedQRData | null) => {
    if (captured) return;
    
    setCaptured(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    updateStatus('capturing', t('status.capturing'));

    const video = videoRef.current;
    if (!video) return;

    try {
      const width = video.videoWidth;
      const height = video.videoHeight;
      
      console.log('[DocumentCapture] Capturing photo:', { width, height, hasQR: !!qrData });

      if (!width || !height) {
        throw new Error('Video dimensions not available');
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('Could not get canvas context');

      ctx.drawImage(video, 0, 0, width, height);

      // Apply B/W threshold if enabled
      if (bwEnabled && window.cv) {
        try {
          const cv = window.cv;
          const src = cv.imread(canvas);
          const gray = new cv.Mat();
          const bw = new cv.Mat();
          
          cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
          cv.threshold(gray, bw, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
          
          // Convert back to canvas
          cv.imshow(canvas, bw);
          
          src.delete();
          gray.delete();
          bw.delete();
        } catch (err) {
          console.error('[DocumentCapture] B/W conversion failed:', err);
          // Continue with color image
        }
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) {
              resolve(b);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/jpeg',
          CONFIG.jpegQuality
        );
      });

      canvas.width = 0;
      canvas.height = 0;

      const result: CaptureResult = {
        blob,
        width,
        height,
        size: blob.size,
        timestamp: Date.now(),
        qrData: qrData || undefined,
      };

      console.log('[DocumentCapture] Capture complete');
      updateStatus('captured', t('status.captured'));
      cleanup();
      onCaptureRef.current(result);
    } catch (err) {
      console.error('[DocumentCapture] Capture error:', err);
      const error = err instanceof Error ? err : new Error(String(err));
      updateStatus('error', error.message);
      onErrorRef.current?.(error);
      setCaptured(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- bwEnabled is a prop, not reactive state
  }, [captured, t, updateStatus, cleanup]);

  /**
   * Manual capture with QR search in all quadrants
   */
  const handleManualCapture = useCallback(async () => {
    if (captured) return;
    
    const video = videoRef.current;
    if (!video) return;
    
    // Create canvas for QR search
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      capturePhoto(null);
      return;
    }
    
    ctx.drawImage(video, 0, 0);
    
    // Search all quadrants
    const qrString = searchQRInAllQuadrants(canvas);
    canvas.width = 0;
    canvas.height = 0;
    
    if (!qrString) {
      // No QR found - show error but don't capture
      alert(t('status.noQr'));
      return;
    }
    
    const qrData = parseQRData(qrString);
    if (!qrData) {
      alert(t('status.noQr'));
      return;
    }
    
    // Valid - capture
    capturePhoto(qrData);
  }, [captured, capturePhoto, t]);

  // Check stability and QR for auto-capture
  const checkStabilityAndQR = useCallback((contour: { area: number }, sharpness: number) => {
    // Check sharpness - apply decay instead of full reset
    if (sharpness < CONFIG.sharpnessThreshold) {
      updateStatus('blurry', t('status.blurry'));
      // Decay progress instead of resetting to 0
      stableProgressRef.current = Math.max(0, stableProgressRef.current - CONFIG.stabilityDecay * 100);
      return;
    }
    
    if (!lastContourRef.current) {
      lastContourRef.current = contour;
      updateStatus('detecting', t('status.holdStill'));
      return;
    }

    // Increment progress based on frame interval vs stability duration
    const progressIncrement = (CONFIG.processIntervalMs / CONFIG.stabilityDuration) * 100;
    stableProgressRef.current = Math.min(100, stableProgressRef.current + progressIncrement);

    if (stableProgressRef.current >= 100) {
      // Stable enough - try to detect QR
      updateStatus('searching_qr', t('status.searchingQr'));
      
      const { valid, qrData } = detectAndValidateQR();
      
      if (valid && qrData) {
        // Success - capture with QR data
        lastQrDataRef.current = qrData;
        capturePhoto(qrData);
      } else {
        // No QR found
        noQrFrameCountRef.current++;
        
        if (noQrFrameCountRef.current >= CONFIG.qrMaxAttempts) {
          updateStatus('no_qr', t('status.noQr'));
        } else {
          updateStatus('searching_qr', t('status.searchingQr'));
        }
      }
    } else {
      const progress = Math.round(stableProgressRef.current);
      updateStatus('stable', `${t('status.holdStill')} ${progress}%`);
    }

    lastContourRef.current = contour;
  }, [t, updateStatus, detectAndValidateQR, capturePhoto]);

  // Document detection using OpenCV
  const detectDocument = useCallback(() => {
    const video = videoRef.current;
    const canvas = processingCanvasRef.current;
    
    if (!video || !canvas || !window.cv || captured) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    try {
      const cv = window.cv;
      const { processWidth: w, processHeight: h } = CONFIG;

      ctx.drawImage(video, 0, 0, w, h);

      const src = cv.imread(canvas);
      const gray = new cv.Mat();
      const blurred = new cv.Mat();
      const thresh = new cv.Mat();
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();

      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      
      // Check sharpness on grayscale
      const sharpness = checkSharpness(gray);
      
      cv.GaussianBlur(gray, blurred, new cv.Size(CONFIG.blurKernel, CONFIG.blurKernel), 0);
      cv.adaptiveThreshold(
        blurred, thresh, 255,
        cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv.THRESH_BINARY_INV,
        CONFIG.adaptiveBlockSize,
        CONFIG.adaptiveC
      );

      if (CONFIG.dilateIterations > 0) {
        const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
        cv.dilate(thresh, thresh, kernel, new cv.Point(-1, -1), CONFIG.dilateIterations);
        kernel.delete();
      }

      cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      let bestContour = null;
      let maxArea = 0;
      const minArea = w * h * CONFIG.minAreaRatio;
      const maxAreaLimit = w * h * CONFIG.maxAreaRatio;

      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);

        if (area > minArea && area < maxAreaLimit && area > maxArea) {
          const peri = cv.arcLength(contour, true);
          const approx = new cv.Mat();
          cv.approxPolyDP(contour, approx, CONFIG.approxEpsilon * peri, true);

          if (approx.rows === 4) {
            maxArea = area;
            if (bestContour) bestContour.delete();
            bestContour = approx.clone();
          }
          approx.delete();
        }
      }

      if (bestContour) {
        checkStabilityAndQR({ area: maxArea / (w * h) }, sharpness);
        bestContour.delete();
      } else {
        lastContourRef.current = null;
        // Decay progress when no document detected
        stableProgressRef.current = Math.max(0, stableProgressRef.current - CONFIG.stabilityDecay * 100);
        noQrFrameCountRef.current = 0;
        updateStatus('ready', t('status.searching'));
      }

      src.delete();
      gray.delete();
      blurred.delete();
      thresh.delete();
      contours.delete();
      hierarchy.delete();
    } catch (err) {
      console.error('Detection error:', err);
    }
  }, [captured, t, updateStatus, checkSharpness, checkStabilityAndQR]);

  // Start detection loop
  const startDetection = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      detectDocument();
    }, CONFIG.processIntervalMs);
  }, [detectDocument]);

  // Initialize OpenCV and camera
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        updateStatus('loading', t('status.loading'));
        await loadOpenCV();
        if (!mounted) return;

        processingCanvasRef.current = document.createElement('canvas');
        processingCanvasRef.current.width = CONFIG.processWidth;
        processingCanvasRef.current.height = CONFIG.processHeight;

        updateStatus('loading', t('status.requestingCamera'));
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: CONFIG.idealWidth },
            height: { ideal: CONFIG.idealHeight },
          },
        });

        if (!mounted) {
          stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
          return;
        }

        streamRef.current = stream;

        // Apply torch if enabled and supported
        const track = stream.getVideoTracks()[0];
        if (track && torchEnabled) {
          try {
            const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
            if (capabilities.torch) {
              await track.applyConstraints({
                advanced: [{ torch: true } as MediaTrackConstraintSet]
              });
            }
          } catch {
            // Torch not supported or failed
          }
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          
          updateStatus('ready', t('status.searching'));
          startDetection();
        }
      } catch (err) {
        if (mounted) {
          const error = err instanceof Error ? err : new Error(String(err));
          updateStatus('error', error.message);
          onErrorRef.current?.(error);
        }
      }
    }

    init();

    return () => {
      mounted = false;
      cleanup();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- torchEnabled handled by separate effect
  }, [t, updateStatus, startDetection, cleanup]);

  // Status indicator color
  const getStatusColor = () => {
    switch (status) {
      case 'stable':
      case 'captured':
      case 'searching_qr':
        return 'text-green-500';
      case 'error':
      case 'no_qr':
        return 'text-red-500';
      case 'detecting':
      case 'blurry':
        return 'text-yellow-500';
      default:
        return 'text-white';
    }
  };

  const handleCancel = () => {
    cleanup();
    onCancel?.();
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Portrait aspect ratio 3:4 for document scanning */}
      <div className="relative rounded-lg overflow-hidden bg-black aspect-[3/4]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Status overlay */}
        <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/70 to-transparent">
          <div className={cn('text-center text-sm font-semibold', getStatusColor())}>
            {status === 'loading' && <Loader2 className="inline w-4 h-4 mr-2 animate-spin" />}
            {statusMessage}
          </div>
        </div>

        {/* Corner guides */}
        <div className="absolute inset-4 pointer-events-none">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/50 rounded-tl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/50 rounded-tr" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/50 rounded-bl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/50 rounded-br" />
        </div>
        
        {/* QR indicator in top-left */}
        {(status === 'searching_qr' || status === 'stable') && (
          <div className="absolute top-4 left-4 w-32 h-32 border-2 border-green-500/70 rounded pointer-events-none animate-pulse" />
        )}
        
        </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center mt-4">
        {showManualCapture && (
          <Button
            onClick={handleManualCapture}
            disabled={captured || status === 'loading'}
            className="flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            {t('buttons.capture')}
          </Button>
        )}
        <Button
          variant="outline"
          onClick={handleCancel}
          className="flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          {t('buttons.cancel')}
        </Button>
      </div>
    </div>
  );
}

export default DocumentCapture;
export { DOCUMENT_CAPTURE_CONFIG } from './config';
export type { DocumentCaptureProps, CaptureResult, CaptureStatus, ParsedQRData } from './types';
