import jsQR from 'jsqr';

interface QRData {
  examId: string;
  studentId: string;
  groupId: string;
  timestamp?: string;
}

/**
 * Extrae los datos del código QR de una imagen
 * @param imageFile Archivo de imagen para procesar
 * @returns Datos extraídos del QR o null si no se pudo extraer
 */
export async function extractQRFromImage(imageFile: File | Blob): Promise<QRData | null> {
  // Crear una imagen a partir del archivo
  const imageBitmap = await createImageBitmap(imageFile);
  
  // Crear un canvas para dibujar la imagen
  const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('No se pudo crear el contexto del canvas');
  }
  
  // Dibujar la imagen en el canvas
  ctx.drawImage(imageBitmap, 0, 0);
  
  // Obtener los datos de la imagen
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Detectar el código QR
  const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
  
  if (!qrCode) {
    return null;
  }
  
  try {
    // Intentar parsear los datos del QR
    const qrData = JSON.parse(qrCode.data);
    
    // Verificar que los datos tengan la estructura esperada
    if (!qrData.examId || !qrData.studentId || !qrData.groupId) {
      throw new Error('Datos de QR incompletos');
    }
    
    return {
      examId: qrData.examId,
      studentId: qrData.studentId,
      groupId: qrData.groupId,
      timestamp: qrData.timestamp,
    };
  } catch (error) {
    console.error('Error parsing QR data:', error);
    return null;
  }
} 