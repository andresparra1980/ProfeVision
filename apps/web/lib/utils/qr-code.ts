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

/**
 * Información decodificada de un QR
 */
export interface DecodedQRData {
  examId: string;
  studentId: string;
  groupId?: string;
  hash: string;
  isValid: boolean;
  timestamp?: string;
}

/**
 * Decodifica el contenido de un QR para extraer sus componentes
 * @param qrData - String del contenido del QR
 * @returns Objeto con los datos decodificados o null si el formato es incorrecto
 */
export function decodeQRData(qrData: string): DecodedQRData | null {
  if (!qrData) return null;
  
  try {
    // Verificar si es un formato JSON (para compatibilidad con versiones anteriores)
    if (qrData.startsWith('{') && qrData.endsWith('}')) {
      try {
        const jsonData = JSON.parse(qrData);
        if (jsonData.examId && jsonData.studentId) {
          const calculatedHash = generateShortHash(jsonData.studentId, jsonData.examId);
          return {
            examId: jsonData.examId,
            studentId: jsonData.studentId,
            groupId: jsonData.groupId,
            hash: jsonData.hash || '',
            timestamp: jsonData.timestamp,
            isValid: jsonData.hash === calculatedHash
          };
        }
      } catch (e) {
        console.error('Error parsing JSON from QR:', e);
      }
    }
    
    // Formato compacto: examId:studentId:hash o examId:studentId:groupId:hash
    const parts = qrData.split(':');
    
    // Para formato sin groupId
    if (parts.length === 3) {
      const [examId, studentId, hash] = parts;
      const calculatedHash = generateShortHash(studentId, examId);
      return {
        examId,
        studentId,
        hash,
        isValid: hash === calculatedHash
      };
    }
    
    // Para formato con groupId
    if (parts.length === 4) {
      const [examId, studentId, groupId, hash] = parts;
      const calculatedHash = generateShortHash(studentId, examId);
      return {
        examId,
        studentId,
        groupId,
        hash,
        isValid: hash === calculatedHash
      };
    }
    
    // Formato inválido
    return null;
  } catch (error) {
    console.error('Error decoding QR data:', error);
    return null;
  }
}

/**
 * Verifica si un código QR es válido para un examen específico
 * @param qrData - Contenido del QR
 * @param examId - ID del examen a verificar
 * @returns boolean - true si el QR es válido para el examen
 */
export function isValidQRForExam(qrData: string, examId: string): boolean {
  const decodedData = decodeQRData(qrData);
  if (!decodedData) return false;
  
  return decodedData.isValid && decodedData.examId === examId;
}

/**
 * Genera una representación legible del contenido del QR
 * @param qrData - Contenido del QR
 * @returns string - Descripción legible del contenido
 */
export function getReadableQRContent(qrData: string): string {
  const decoded = decodeQRData(qrData);
  if (!decoded) return 'Formato QR no reconocido';
  
  const validText = decoded.isValid 
    ? '✓ Hash verificado' 
    : '❌ Hash inválido';
  
  let result = `Examen: ${decoded.examId}\nEstudiante: ${decoded.studentId}\n${validText}`;
  
  if (decoded.groupId) {
    result += `\nGrupo: ${decoded.groupId}`;
  }
  
  if (decoded.timestamp) {
    const date = new Date(decoded.timestamp);
    result += `\nFecha: ${date.toLocaleString()}`;
  }
  
  return result;
} 