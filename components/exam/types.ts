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
  examId?: string;
  examenId?: string;
  exam_id?: string;
  examen_id?: string;
  studentId?: string;
  estudianteId?: string;
  student_id?: string;
  estudiante_id?: string;
  groupId?: string;
  grupoId?: string;
  group_id?: string;
  grupo_id?: string;
  formId?: string;
  examTitle?: string;
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
 * Result data from processing a scanned exam
 */
export interface ProcessingResult {
  success?: boolean;
  processedImage?: string | null;
  processedImageUrl?: string;
  processedImageData?: string | null;
  originalImageData?: string | null;
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
  originalImageData?: string | null;
  processedImageData?: string | null;
  qrData?: QRData | null;
  answers?: Answer[];
  resultadoId?: string;
  isDuplicate?: boolean;
  duplicateInfo?: DuplicateInfo | null;
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

/**
 * Result data from processing a scanned exam
 */
export interface OMRResult {
  success: boolean;
  message?: string;
  error?: string;
  error_code?: string;
  error_details?: ErrorDetails;
  
  answers: Answer[];
  qr_data: QRData;
  original_image?: string;
  processed_image?: string;
  publicUrl?: string;
  
  // Image data in base64 format
  originalImageData?: string | null;
  processedImageData?: string | null;
  
  total_questions?: number;
  confidence?: number;
} 