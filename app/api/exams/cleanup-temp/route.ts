import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import logger from '@/lib/utils/logger';
import { getApiTranslator } from '@/i18n/api';

const DEBUG = process.env.NODE_ENV === 'development';

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'No se proporcionó URL de imagen' },
        { status: 400 }
      );
    }

    // Extraer el nombre del archivo de la URL y obtener el nombre base
    const filename = path.basename(imageUrl);
    let baseFilename = filename;

    // Si el archivo termina en questions_detected.jpeg, obtener el nombre base original
    if (filename.endsWith('questions_detected.jpeg')) {
      baseFilename = filename.replace('questions_detected.jpeg', '');
    } else {
      // Si es el archivo original, remover cualquier extensión
      baseFilename = filename.replace(/\.[^/.]+$/, '');
    }

    // Construir rutas de archivos a eliminar
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'omr');

    // Listar todos los archivos en el directorio
    const files = await fs.readdir(uploadDir);

    // Filtrar los archivos que coinciden con el patrón del nombre base
    const filesToDelete = files
      .filter(file => {
        // Buscar cualquier archivo que comience con el nombre base
        // y que sea el original (con cualquier extensión) o el procesado
        const isProcessedFile = file === `${baseFilename}questions_detected.jpeg`;
        const isOriginalFile = file.startsWith(baseFilename) && 
                             file !== `${baseFilename}questions_detected.jpeg` &&
                             /\.(jpg|jpeg|png)$/i.test(file);
        
        return isProcessedFile || isOriginalFile;
      })
      .map(file => path.join(uploadDir, file));

    if (DEBUG) {
      logger.log('Archivos a eliminar:', filesToDelete);
    }

    // Eliminar archivos si existen
    for (const file of filesToDelete) {
      try {
        await fs.unlink(file);
        if (DEBUG) {
          logger.log(`Archivo eliminado: ${file}`);
        }
      } catch (error) {
        // Ignorar errores si el archivo no existe
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          if (DEBUG) {
            logger.error(`Error al eliminar archivo ${file}:`, error);
          }
        }
      }
    }

    const { t } = await getApiTranslator(req, 'exams.cleanup-temp');
    return NextResponse.json({
      success: true,
      message: t('success.deleted'),
      filesDeleted: filesToDelete.map(f => path.basename(f))
    });

  } catch (error: unknown) {
    if (DEBUG) {
      logger.error('Error al limpiar archivos temporales:', error);
    }
    const { t } = await getApiTranslator(req, 'exams.cleanup-temp');
    return NextResponse.json(
      { 
        error: t('errors.cleanup'),
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 