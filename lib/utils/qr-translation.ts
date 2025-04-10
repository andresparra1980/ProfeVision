/**
 * Utilidades para traducir IDs de QR a nombres legibles para el usuario
 */
import logger from '@/lib/utils/logger';

export interface QREntities {
  examName?: string | null;
  studentName?: string | null;
  groupName?: string | null;
}

// Caché de traducciones para evitar solicitudes repetidas
interface CacheEntry {
  data: QREntities;
  timestamp: number;
}

const translationCache: Record<string, CacheEntry> = {};
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutos en milisegundos

/**
 * Traduce los IDs del código QR a nombres legibles
 * @param examId ID del examen
 * @param studentId ID del estudiante
 * @param groupId ID del grupo (opcional)
 * @returns Objeto con los nombres traducidos
 */
export async function translateQRData(
  examId?: string,
  studentId?: string,
  groupId?: string
): Promise<QREntities> {
  try {
    // Si no hay IDs, devolver objeto vacío
    if (!examId && !studentId && !groupId) {
      return {};
    }

    // Generar clave para el caché
    const cacheKey = `${examId || ''}-${studentId || ''}-${groupId || ''}`;
    
    // Verificar si tenemos una versión en caché válida
    const now = Date.now();
    const cachedEntry = translationCache[cacheKey];
    
    if (cachedEntry && (now - cachedEntry.timestamp < CACHE_EXPIRATION)) {
      logger.log('Usando datos de caché para:', cacheKey);
      return cachedEntry.data;
    }

    // Llamar al endpoint de traducción
    logger.log('Realizando solicitud a API para:', cacheKey);
    const response = await fetch('/api/qr/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        examId,
        studentId,
        groupId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error en la traducción: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Error desconocido en la traducción');
    }

    // Guardar en caché
    translationCache[cacheKey] = {
      data: result.data,
      timestamp: now
    };

    return result.data as QREntities;
  } catch (error) {
    logger.error('Error al traducir datos de QR:', error);
    // En caso de error, devolver los IDs como fallback
    return {
      examName: examId ? `Examen (${examId.substring(0, 8)}...)` : null,
      studentName: studentId ? `Estudiante (${studentId.substring(0, 8)}...)` : null,
      groupName: groupId ? `Grupo (${groupId.substring(0, 8)}...)` : null,
    };
  }
}

/**
 * Versión simple que muestra un texto amigable si falla la traducción
 */
export function getReadableEntityName(id: string | undefined | null, prefix: string): string {
  if (!id) return `${prefix} no disponible`;
  // Truncar ID largo para mostrar solo primeros 8 caracteres
  return `${prefix} (${id.substring(0, 8)}...)`;
} 