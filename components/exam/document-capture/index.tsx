'use client';

/**
 * DocumentCapture Component
 * 
 * Auto document capture using OpenCV.js with adaptive thresholding.
 * Optimized for exam sheets.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2 } from 'lucide-react';
import { DOCUMENT_CAPTURE_CONFIG } from './config';
import type { DocumentCaptureProps, CaptureStatus, CaptureResult } from './types';
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
    // Use absolute URL to avoid locale prefix issues
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

export function DocumentCapture({
  onCapture,
  onError,
  onStatusChange,
  onCancel,
  className = '',
  showManualCapture = true,
}: DocumentCaptureProps) {
  const t = useTranslations('document-capture');
  const videoRef = useRef<HTMLVideoElement>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [status, setStatus] = useState<CaptureStatus>('loading');
  const [statusMessage, setStatusMessage] = useState('');
  const [captured, setCaptured] = useState(false);
  
  const lastContourRef = useRef<{ area: number } | null>(null);
  const stableStartTimeRef = useRef<number | null>(null);
  
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

  // Capture photo
  const capturePhoto = useCallback(async () => {
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
      
      console.log('[DocumentCapture] Capturing photo:', { width, height });

      if (!width || !height) {
        throw new Error('Video dimensions not available');
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('Could not get canvas context');

      ctx.drawImage(video, 0, 0, width, height);
      
      console.log('[DocumentCapture] Canvas drawn, creating blob...');

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) {
              console.log('[DocumentCapture] Blob created:', b.size, 'bytes');
              resolve(b);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/jpeg',
          CONFIG.jpegQuality
        );
      });

      // Cleanup canvas
      canvas.width = 0;
      canvas.height = 0;

      const result: CaptureResult = {
        blob,
        width,
        height,
        size: blob.size,
        timestamp: Date.now(),
      };

      console.log('[DocumentCapture] Capture complete, calling onCapture');
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
  }, [captured, t, updateStatus, cleanup]);

  // Check stability for auto-capture
  const checkStability = useCallback((contour: { area: number }) => {
    if (!lastContourRef.current) {
      lastContourRef.current = contour;
      stableStartTimeRef.current = Date.now();
      updateStatus('detecting', t('status.holdStill'));
      return;
    }

    const stableTime = Date.now() - (stableStartTimeRef.current || 0);

    if (stableTime >= CONFIG.stabilityDuration) {
      capturePhoto();
    } else {
      const progress = Math.round((stableTime / CONFIG.stabilityDuration) * 100);
      updateStatus('stable', `${t('status.holdStill')} ${progress}%`);
    }

    lastContourRef.current = contour;
  }, [t, updateStatus, capturePhoto]);

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
        checkStability({ area: maxArea / (w * h) });
        bestContour.delete();
      } else {
        lastContourRef.current = null;
        stableStartTimeRef.current = null;
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
  }, [captured, t, updateStatus, checkStability]);

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
  }, [t, updateStatus, startDetection, cleanup]);

  // Status indicator color
  const getStatusColor = () => {
    switch (status) {
      case 'stable':
      case 'captured':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'detecting':
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
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center mt-4">
        {showManualCapture && (
          <Button
            onClick={() => capturePhoto()}
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
export type { DocumentCaptureProps, CaptureResult, CaptureStatus } from './types';
