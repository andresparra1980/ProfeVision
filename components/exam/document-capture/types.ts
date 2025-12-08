/**
 * Document Capture - TypeScript Types
 */

export type CaptureStatus = 
  | 'loading'
  | 'ready'
  | 'detecting'
  | 'stable'
  | 'searching_qr'
  | 'blurry'
  | 'no_qr'
  | 'capturing'
  | 'captured'
  | 'error';

export interface CaptureResult {
  blob: Blob;
  width: number;
  height: number;
  size: number;
  timestamp: number;
  qrData?: ParsedQRData;
}

export interface ParsedQRData {
  examId: string;
  studentId: string;
  groupId?: string;
  hash?: string;
}

export interface DocumentCaptureProps {
  onCapture: (_result: CaptureResult) => void;
  onError?: (_error: Error) => void;
  onStatusChange?: (_status: CaptureStatus, _message: string) => void;
  onCancel?: () => void;
  className?: string;
  showManualCapture?: boolean;
}

// OpenCV types are declared globally via window.cv
declare global {
  interface Window {
    cv: {
      getBuildInformation?: () => string;
      onRuntimeInitialized?: () => void;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    };
  }
}
