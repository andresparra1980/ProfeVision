import { QRData, Answer, ErrorDetails } from '@/components/exam/types';

/**
 * Process result data from scanning and processing an exam
 */
export interface ProcessResult {
  success: boolean;
  qr_data?: QRData;
  result?: {
    processed_image_path?: string;
    answers?: Answer[];
    qr_data?: QRData;
  };
  error_details?: ErrorDetails;
} 