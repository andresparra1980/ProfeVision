import QRCode from 'qrcode';
import CryptoJS from 'crypto-js';

// Configuración optimizada para QR codes
const QR_CONFIG = {
  // Tamaño en píxeles (300px para mejor detección)
  width: 300,
  // Margen mínimo (en módulos QR, no píxeles)
  margin: 4,
  // Nivel de corrección de errores medio-alto para balance entre densidad y corrección
  errorCorrectionLevel: 'M' as const,
  // Máximo contraste en colores
  color: {
    dark: '#000000',
    light: '#ffffff'
  },
  // Calidad de renderizado
  rendererOpts: {
    quality: 1.0
  }
} as const;

/**
 * Genera un hash corto para validación
 * @returns string - Hash de 8 caracteres
 */
function generateShortHash(studentId: string, examId: string): string {
  const secret = process.env.EXAM_RESPONSE_SHEET_SECRET_KEY || 'default-secret';
  const data = `${studentId}:${examId}`;
  // Generamos un hash y tomamos solo los primeros 8 caracteres
  return CryptoJS.HmacSHA256(data, secret).toString().slice(0, 8);
}

/**
 * Genera datos optimizados para el QR
 * @returns string - Datos en formato compacto
 */
export function generateOptimizedQRData(params: {
  studentId: string;
  examId: string;
  groupId?: string;
}): string {
  // Formato compacto: examId:studentId:hash
  // o examId:studentId:groupId:hash para el generador de PDF
  const hash = generateShortHash(params.studentId, params.examId);
  return params.groupId
    ? `${params.examId}:${params.studentId}:${params.groupId}:${hash}`
    : `${params.examId}:${params.studentId}:${hash}`;
}

/**
 * Genera un QR code como Data URL con configuración optimizada
 * @param data - Datos a codificar en el QR
 * @returns Promise<string> - Data URL del QR code
 */
export async function generateOptimizedQRCode(data: string): Promise<string> {
  return await QRCode.toDataURL(data, QR_CONFIG);
} 