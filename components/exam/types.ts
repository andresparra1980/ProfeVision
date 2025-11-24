/**
 * Common types used across exam components
 */

// Default options
export const DEFAULT_NUM_OPTIONS = 4;
export const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']; // Support up to 8 options

/**
 * Information about a duplicate exam result
 */
export interface DuplicateInfo {
  resultadoId: string;
  fecha_calificacion: string;
  puntaje: number;
  porcentaje: number;
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * QR Data structure from scanned exams
 */
export interface QRData {
  examId: string;
  studentId: string;
  groupId?: string;
  version?: string;
  isDuplicate?: boolean;
  duplicateInfo?: DuplicateInfo;
  [key: string]: string | boolean | DuplicateInfo | undefined;
}

/**
 * QR validation state
 */
export interface QRValidation {
  validated: boolean;
  data: QRData | null;
}

/**
 * Final output of the processing
 */
export interface FinalOutput {
  qrData: QRData | null;
  answers: Answer[] | Record<string, unknown>;
  originalImage: string | null;
  processedImage: string | null;
}

/**
 * Answer structure for exam results
 */
export interface Answer {
  number: number;
  value: string;
  confidence?: number;
  num_options?: number;
  disabled?: boolean;
  pregunta_id?: string;
  opcion_id?: string;
  es_correcta?: boolean;
}

/**
 * Error details for processing failures
 */
export interface ErrorDetails {
  message: string;
  recommendations: string[];
  [key: string]: string | string[] | undefined;
}

/**
 * Response from OMR Direct API
 */
export interface OMRDirectResponse {
  success: boolean;
  qr_data: string | null;
  total_questions: number;
  answered_questions: number;
  answers: Answer[];
  original_image: string | null;
  processed_image: string | null;
  error?: string;
  error_code?: string;
}

/**
 * Response from Legacy API (via Vercel)
 */
export interface OMRLegacyResponse {
  success: boolean;
  result?: {
    processed_image_path?: string;
    answers?: Answer[];
    qr_data?: string | QRData;
  };
  processedImage?: string | null;
  processedImageUrl?: string;
  publicUrl?: string;
  answers?: Answer[];
  error?: string;
  error_details?: ErrorDetails;
}

/**
 * Result data from processing a scanned exam (unified format)
 */
export interface ProcessingResult {
  success?: boolean;
  processedImage?: string | null;
  processedImageUrl?: string;
  publicUrl?: string;
  qrData?: QRData | null;
  qr_data?: QRData;
  result?: {
    processed_image_path?: string;
    answers?: Answer[];
    qr_data?: QRData;
  };
  answers?: Answer[];
  isDuplicate?: boolean;
  duplicateInfo?: DuplicateInfo;
  isManualScan?: boolean;
  error_details?: ErrorDetails;
}

/**
 * Data structure for tracking scan state
 */
export interface ScanData {
  originalImage?: string;
  processedImage?: string | null;
  qrData?: QRData | null;
  answers?: Answer[];
  resultadoId?: string;
}

/**
 * Entity names for displaying in results
 */
export interface EntityNames {
  materia: string;
  examen: string;
  estudiante: string;
  grupo: string;
  loading: boolean;
  error: string | null;
}

/**
 * Exam score calculation result
 */
export interface ExamScore {
  correctAnswers: number;
  totalQuestions: number;
  percentage: number;
  loading: boolean;
  error: string | null;
  puntajeTotal?: number;
  puntajeObtenido?: number;
} 