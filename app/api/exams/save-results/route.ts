import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { promises as _fsPromises } from 'fs';
import * as _path from 'path';
import sharp from 'sharp';
import logger from '@/lib/utils/logger';

const DEBUG = process.env.NODE_ENV === 'development';

// Configuración para el cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Configuración para el bucket S3
const s3BucketName = process.env.S3_BUCKET_NAME || 'examenes-escaneados';

// Función auxiliar para comprimir imágenes
async function compressImage(imageBase64: string, quality: number = 80, maxSize: number = 1200, isOriginal: boolean = false): Promise<Buffer> {
  // Configurar flag de debug para mensajes de consola
  const DEBUG = process.env.NODE_ENV === 'development';
  
  try {
    // Detectar formato si no se proporciona
    let base64Data = imageBase64;
    
    // Eliminar encabezado de data URI si existe
    if (imageBase64.startsWith('data:image/')) {
      base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    }
    
    // Decodificar la cadena base64 a un buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Verificar que el buffer no está vacío
    if (buffer.length < 100) {
      if (DEBUG) logger.error('Buffer de imagen demasiado pequeño para comprimir');
      return buffer;
    }
    
    try {
      // Crear una instancia de sharp con opciones permisivas
      const sharpInstance = sharp(buffer, { 
        failOnError: false,
        limitInputPixels: 0  // Sin límite de píxeles
      });
      
      // Si es la imagen original, rotarla 90 grados a la derecha para corregir la orientación
      if (isOriginal) {
        sharpInstance.rotate(90);
        if (DEBUG) logger.log('Aplicando rotación de 90° a imagen original para corregir orientación');
      }
      
      // Redimensionar si es muy grande
      sharpInstance.resize(maxSize, maxSize, {
        fit: 'inside',
        withoutEnlargement: true
      });
      
      // Siempre usar PNG para mejor calidad y preservar transparencia
      sharpInstance.png({ quality });
      
      if (DEBUG) {
        logger.log(`Procesando imagen como PNG, ${isOriginal ? 'con rotación' : 'sin rotación'}`);
      }
      
      return await sharpInstance.toBuffer()
        .catch(err => {
          if (DEBUG) logger.error('Error en sharp.toBuffer():', err);
          return buffer; // Devolver buffer original en caso de error
        });
    } catch (sharpError) {
      if (DEBUG) logger.error('Error al usar sharp:', sharpError);
      return buffer; // Devolver buffer original en caso de error
    }
  } catch (error) {
    if (DEBUG) logger.error('Error al comprimir imagen:', error);
    
    // Si la decodificación base64 falla, intentamos devolver un buffer vacío
    try {
      return Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    } catch (fallbackError) {
      if (DEBUG) logger.error('Error en fallback de buffer:', fallbackError);
      return Buffer.from([]); // Buffer vacío como último recurso
    }
  }
}

interface Answer {
  pregunta_id: string;
  opcion_id: string;
  es_correcta: boolean;
}

interface Pregunta {
  id: string;
  puntaje: string;
  habilitada: boolean;
}

interface QRData {
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
  profesorId?: string;
  profesor_id?: string;
}

interface DuplicateInfo {
  resultadoId: string;
}

interface SaveResultsData {
  qrData: QRData;
  answers: Answer[];
  originalImage: string;
  processedImage: string;
  examScore: number;
  isDuplicate?: boolean;
  duplicateInfo?: DuplicateInfo;
}

// Function to clean up temporary files in the uploads/omr directory
async function cleanupUploadsDirectory() {
  const uploadsDir = `${process.cwd()}/public/uploads/omr`;
  
  try {
    // Check if directory exists
    try {
      await _fsPromises.access(uploadsDir);
    } catch (_err) {
      // Directory doesn't exist, nothing to clean up
      return;
    }
    
    // Read all files in directory
    const files = await _fsPromises.readdir(uploadsDir);
    const now = Date.now();
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const MIN_IMAGE_AGE = 10 * 60 * 1000; // 10 minutes - don't delete images newer than this
    
    // Process each file
    for (const file of files) {
      if (file === '.gitkeep') continue; // Skip .gitkeep file
      
      const filePath = `${uploadsDir}/${file}`;
      try {
        const stats = await _fsPromises.stat(filePath);
        const fileAge = now - stats.mtime.getTime();
        
        // Delete if older than MAX_AGE
        // For image files, only delete if they're older than MIN_IMAGE_AGE
        if (fileAge > MAX_AGE || (fileAge > MIN_IMAGE_AGE && file.match(/\.(jpg|jpeg|png|gif)$/i))) {
          await _fsPromises.unlink(filePath);
          if (DEBUG) {
            logger.log(`Cleaned up old file: ${file}, age: ${fileAge / (60 * 60 * 1000)} hours`);
          }
        }
      } catch (err) {
        if (DEBUG) {
          logger.warn(`Error processing file ${file}:`, err);
        }
      }
    }
  } catch (err) {
    if (DEBUG) {
      logger.warn('Error during uploads directory cleanup:', err);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    // Capture request timing for debugging
    const requestId = Date.now().toString();
    if (DEBUG) {
      logger.log(`[${requestId}] Starting save-results request`);
    }

    // Parse request body with error handling
    let data: SaveResultsData;
    try {
      data = await req.json() as SaveResultsData;
    } catch (parseError) {
      // Log error details for debugging
      logger.error(`[${requestId}] Error parseando JSON:`, parseError);
      return NextResponse.json(
        { error: 'Error al procesar datos de entrada', details: String(parseError) },
        { status: 400 }
      );
    }

    // Extract and validate data
    const { qrData, answers, originalImage, processedImage, examScore, isDuplicate, duplicateInfo } = data;
    
    // Validate that the required data exists
    if (!qrData || !qrData.examId || !qrData.studentId) {
      if (DEBUG) {
        logger.error('Invalid QR data:', qrData);
      }
      return NextResponse.json({ error: 'Datos de QR incompletos' }, { status: 400 });
    }

    // Check all required fields are present
    if (!qrData || !answers || !originalImage || !processedImage || !examScore) {
      return NextResponse.json({ 
        error: 'Datos incompletos',
        details: {
          hasQrData: !!qrData,
          hasAnswers: !!answers,
          answersLength: answers?.length || 0,
          hasOriginalImage: !!originalImage,
          hasProcessedImage: !!processedImage,
          hasExamScore: !!examScore
        }
      }, { status: 400 });
    }

    // Inicializar cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });

    // Extraer información del QR
    const examId = qrData.examId || qrData.examenId || qrData.exam_id || qrData.examen_id;
    const studentId = qrData.studentId || qrData.estudianteId || qrData.student_id || qrData.estudiante_id;
    const _groupId = qrData.groupId || qrData.grupoId || qrData.group_id || qrData.grupo_id;
    
    if (!examId || !studentId) {
      return NextResponse.json({ error: 'Datos de QR incompletos' }, { status: 400 });
    }

    // Obtener profesor_id del examen al principio
    let profesorId;
    try {
      const { data: examData, error: examError } = await supabase
        .from('examenes')
        .select('profesor_id')
        .eq('id', examId)
        .single();

      if (examError) {
        if (DEBUG) {
          logger.error('Error al obtener profesor_id del examen:', examError);
        }
        // Continuamos aunque no tengamos el profesor_id
      } else {
        profesorId = examData.profesor_id;
      }
    } catch (error) {
      if (DEBUG) {
        logger.error('Error al obtener profesor_id:', error);
      }
      // Continuamos sin profesor_id
    }
    
    // Verificar si ya existe un registro para este examen y estudiante
    // y eliminarlo junto con sus imágenes en S3
    try {
      // 1. Buscar resultados existentes para este examen y estudiante
      const { data: existingResults, error: existingResultsError } = await supabase
        .from('resultados_examen')
        .select('id')
        .eq('examen_id', examId)
        .eq('estudiante_id', studentId);
        
      if (existingResultsError) {
        if (DEBUG) {
          logger.error('Error al buscar resultados existentes:', existingResultsError);
        }
      } else if (existingResults && existingResults.length > 0) {
        if (DEBUG) {
          logger.log(`Encontrados ${existingResults.length} resultados existentes para eliminar`);
        }
        
        // Procesar cada resultado encontrado
        for (const result of existingResults) {
          const resultadoId = result.id;
          
          // 2. Buscar escaneos asociados a este resultado
          const { data: escaneos, error: escaneosError } = await supabase
            .from('examenes_escaneados')
            .select('*')
            .eq('resultado_id', resultadoId);
            
          if (escaneosError) {
            if (DEBUG) {
              logger.error(`Error al buscar escaneos para resultado ${resultadoId}:`, escaneosError);
            }
          } else if (escaneos && escaneos.length > 0) {
            if (DEBUG) {
              logger.log(`Encontrados ${escaneos.length} escaneos para eliminar`);
            }
            
            // Eliminar las imágenes de S3 para cada escaneo
            for (const escaneo of escaneos) {
              // Eliminar imágenes si existen rutas S3
              if (escaneo.ruta_s3_original) {
                // Extraer la ruta relativa sin el nombre del bucket
                const rutaRelativa = escaneo.ruta_s3_original.replace(`${s3BucketName}/`, '');
                try {
                  const { data, error } = await supabase.storage
                    .from(s3BucketName)
                    .remove([rutaRelativa]);
                    
                  if (error) {
                    if (DEBUG) {
                      logger.error(`Error al eliminar imagen original: ${error.message}`, error);
                    }
                  } else if (DEBUG) {
                    logger.log(`Eliminada imagen original: ${rutaRelativa}`, data);
                  }
                } catch (e) {
                  if (DEBUG) {
                    logger.error(`Excepción al eliminar imagen original:`, e);
                  }
                }
              }
              
              if (escaneo.ruta_s3_procesado) {
                // Extraer la ruta relativa sin el nombre del bucket
                const rutaRelativa = escaneo.ruta_s3_procesado.replace(`${s3BucketName}/`, '');
                try {
                  const { data, error } = await supabase.storage
                    .from(s3BucketName)
                    .remove([rutaRelativa]);
                    
                  if (error) {
                    if (DEBUG) {
                      logger.error(`Error al eliminar imagen procesada: ${error.message}`, error);
                    }
                  } else if (DEBUG) {
                    logger.log(`Eliminada imagen procesada: ${rutaRelativa}`, data);
                  }
                } catch (e) {
                  if (DEBUG) {
                    logger.error(`Excepción al eliminar imagen procesada:`, e);
                  }
                }
              }
              
              // Eliminar el registro de examenes_escaneados
              const { error: deleteEscaneoError } = await supabase
                .from('examenes_escaneados')
                .delete()
                .eq('id', escaneo.id);
                
              if (deleteEscaneoError) {
                if (DEBUG) {
                  logger.error(`Error al eliminar escaneo ${escaneo.id}:`, deleteEscaneoError);
                }
              }
            }
          }
          
          // 3. Eliminar respuestas asociadas
          const { error: deleteRespuestasError } = await supabase
            .from('respuestas_estudiante')
            .delete()
            .eq('resultado_id', resultadoId);
            
          if (deleteRespuestasError) {
            if (DEBUG) {
              logger.error(`Error al eliminar respuestas para resultado ${resultadoId}:`, deleteRespuestasError);
            }
          }
          
          // 4. Eliminar el resultado
          const { error: deleteResultadoError } = await supabase
            .from('resultados_examen')
            .delete()
            .eq('id', resultadoId);
            
          if (deleteResultadoError) {
            if (DEBUG) {
              logger.error(`Error al eliminar resultado ${resultadoId}:`, deleteResultadoError);
            }
          }
        }
      }
    } catch (error) {
      if (DEBUG) {
        logger.error('Error al procesar registros existentes:', error);
      }
      // Continuamos aunque haya errores en la limpieza previa
    }

    // Obtener preguntas habilitadas del examen (solo para calcular la nota)
    const { data: preguntas, error: preguntasError } = await supabase
      .from('preguntas')
      .select('id, puntaje, habilitada')
      .eq('examen_id', examId)
      .order('orden');

    if (preguntasError) {
      if (DEBUG) {
        logger.error('Error al obtener preguntas:', preguntasError);
      }
      return NextResponse.json(
        { error: 'Error al obtener preguntas del examen' },
        { status: 500 }
      );
    }

    // Filtrar preguntas habilitadas solo para el cálculo de la nota
    const preguntasHabilitadas = preguntas.filter((p: Pregunta) => p.habilitada);

    // Contar respuestas correctas (solo de preguntas habilitadas)
    const respuestasCorrectas = answers.filter((answer: Answer) => 
      preguntasHabilitadas.some((p: Pregunta) => p.id === answer.pregunta_id && answer.es_correcta)
    ).length;
    
    // Calcular porcentaje (respuestas correctas / total preguntas habilitadas)
    const porcentajeCorrectas = (respuestasCorrectas / preguntasHabilitadas.length) * 100;
    
    // Calcular nota final (0-5)
    const notaFinal = (respuestasCorrectas / preguntasHabilitadas.length) * 5;

    // Si es un duplicado, eliminamos el resultado anterior
    if (isDuplicate && duplicateInfo && duplicateInfo.resultadoId) {
      try {
        if (DEBUG) {
          logger.log('Eliminando resultado duplicado anterior:', duplicateInfo.resultadoId);
        }

        // 1. Primero obtener datos del resultado escaneado
        const { data: escaneoData, error: escaneoError } = await supabase
          .from('examenes_escaneados')
          .select('*')
          .eq('resultado_id', duplicateInfo.resultadoId)
          .single();

        if (escaneoError) {
          if (DEBUG) {
            logger.error('Error al obtener datos del escaneo anterior:', escaneoError);
          }
        }

        // 2. Eliminar imágenes si existen
        if (escaneoData) {
          // Usar las rutas S3 directamente del registro para eliminar los archivos
          if (escaneoData.ruta_s3_original) {
            try {
              const { data, error } = await supabase.storage
                .from(s3BucketName)
                .remove([escaneoData.ruta_s3_original]);
                
              if (error) {
                if (DEBUG) {
                  logger.error(`Error al eliminar imagen original S3: ${error.message}`, error);
                }
              } else if (DEBUG) {
                logger.log(`Eliminada imagen original: ${escaneoData.ruta_s3_original}`, data);
              }
            } catch (e) {
              if (DEBUG) {
                logger.error(`Excepción al eliminar imagen original S3:`, e);
              }
            }
          } else if (escaneoData.archivo_original) {
            // Compatibilidad con datos antiguos - construir la ruta completa
            const rutaAntigua = profesorId && examId ? 
              `examenes-escaneados/${profesorId}/${examId}/${escaneoData.archivo_original}` : 
              `examenes-escaneados/unassigned/${escaneoData.archivo_original}`;
              
            try {
              const { data, error } = await supabase.storage
                .from(s3BucketName)
                .remove([rutaAntigua]);
                
              if (error) {
                if (DEBUG) {
                  logger.error(`Error al eliminar imagen original S3 (ruta antigua): ${error.message}`, error);
                }
              } else if (DEBUG) {
                logger.log(`Eliminada imagen original (ruta antigua): ${rutaAntigua}`, data);
              }
            } catch (e) {
              if (DEBUG) {
                logger.error(`Excepción al eliminar imagen original S3 (ruta antigua):`, e);
              }
            }
          }
          
          if (escaneoData.ruta_s3_procesado) {
            try {
              const { data, error } = await supabase.storage
                .from(s3BucketName)
                .remove([escaneoData.ruta_s3_procesado]);
                
              if (error) {
                if (DEBUG) {
                  logger.error(`Error al eliminar imagen procesada S3: ${error.message}`, error);
                }
              } else if (DEBUG) {
                logger.log(`Eliminada imagen procesada: ${escaneoData.ruta_s3_procesado}`, data);
              }
            } catch (e) {
              if (DEBUG) {
                logger.error(`Excepción al eliminar imagen procesada S3:`, e);
              }
            }
          } else if (escaneoData.archivo_procesado) {
            // Compatibilidad con datos antiguos - construir la ruta completa
            const rutaAntigua = profesorId && examId ? 
              `examenes-escaneados/${profesorId}/${examId}/${escaneoData.archivo_procesado}` : 
              `examenes-escaneados/unassigned/${escaneoData.archivo_procesado}`;
              
            try {
              const { data, error } = await supabase.storage
                .from(s3BucketName)
                .remove([rutaAntigua]);
                
              if (error) {
                if (DEBUG) {
                  logger.error(`Error al eliminar imagen procesada S3 (ruta antigua): ${error.message}`, error);
                }
              } else if (DEBUG) {
                logger.log(`Eliminada imagen procesada (ruta antigua): ${rutaAntigua}`, data);
              }
            } catch (e) {
              if (DEBUG) {
                logger.error(`Excepción al eliminar imagen procesada S3 (ruta antigua):`, e);
              }
            }
          }
          
          // Eliminar el registro de examenes_escaneados
          const { error: deleteEscaneoError } = await supabase
            .from('examenes_escaneados')
            .delete()
            .eq('resultado_id', duplicateInfo.resultadoId);

          if (deleteEscaneoError) {
            if (DEBUG) {
              logger.error('Error al eliminar escaneo anterior:', deleteEscaneoError);
            }
          }
        }

        // 3. Eliminar las respuestas estudiante asociadas
        const { error: deleteRespuestasError } = await supabase
          .from('respuestas_estudiante')
          .delete()
          .eq('resultado_id', duplicateInfo.resultadoId);

        if (deleteRespuestasError) {
          if (DEBUG) {
            logger.error('Error al eliminar respuestas anteriores:', deleteRespuestasError);
          }
        }

        // 4. Eliminar el registro de resultados_examen
        const { error: deleteError } = await supabase
          .from('resultados_examen')
          .delete()
          .eq('id', duplicateInfo.resultadoId);

        if (deleteError) {
          if (DEBUG) {
            logger.error('Error al eliminar resultado anterior:', deleteError);
          }
        }
      } catch (error) {
        if (DEBUG) {
          logger.error('Error durante la eliminación del resultado anterior:', error);
        }
      }
    }

    // Comprimir imágenes
    const compressedOriginal = await compressImage(originalImage, 80, 1200, true);
    const compressedProcessed = await compressImage(processedImage, 80, 1200, false);

    // Construir rutas S3 completas con la estructura de carpetas correcta
    const s3PathPrefix = profesorId && examId ? 
      `examenes-escaneados/${profesorId}/${examId}/` : 
      'examenes-escaneados/unassigned/'; // Carpeta de respaldo si falta algún ID
    
    // Generar nombres únicos para las imágenes con timestamp para evitar colisiones
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const originalFileName = `${uuidv4()}_original_${timestamp}.png`;
    const processedFileName = `${uuidv4()}_processed_${timestamp}.png`;
    
    // Rutas completas para S3
    const s3OriginalPath = `${s3PathPrefix}${originalFileName}`;
    const s3ProcessedPath = `${s3PathPrefix}${processedFileName}`;

    // Subir imágenes comprimidas a Supabase Storage con la ruta adecuada
    const { error: originalError } = await supabase.storage
      .from(s3BucketName)
      .upload(s3OriginalPath, compressedOriginal, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (originalError) {
      if (DEBUG) {
        logger.error('Error al subir imagen original:', originalError);
      }
      return NextResponse.json(
        { error: 'Error al guardar imagen original' },
        { status: 500 }
      );
    }

    const { error: processedError } = await supabase.storage
      .from(s3BucketName)
      .upload(s3ProcessedPath, compressedProcessed, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (processedError) {
      if (DEBUG) {
        logger.error('Error al subir imagen procesada:', processedError);
      }
      return NextResponse.json(
        { error: 'Error al guardar imagen procesada' },
        { status: 500 }
      );
    }

    // Obtener URLs públicas de las imágenes
    const { data: originalUrlData } = await supabase.storage
      .from(s3BucketName)
      .getPublicUrl(s3OriginalPath);

    const { data: processedUrlData } = await supabase.storage
      .from(s3BucketName)
      .getPublicUrl(s3ProcessedPath);

    // Guardar resultados en la base de datos
    // Primero creamos el registro en resultados_examen (sin el campo respuestas)
    const { data: resultadoExamen, error: resultadoExamenError } = await supabase
      .from('resultados_examen')
      .insert({
        examen_id: examId,
        estudiante_id: studentId,
        puntaje_obtenido: notaFinal,
        porcentaje: porcentajeCorrectas,
        fecha_calificacion: new Date().toISOString(),
        estado: 'CALIFICADO'
      })
      .select()
      .single();

    if (resultadoExamenError) {
      if (DEBUG) {
        logger.error('Error al guardar en resultados_examen:', resultadoExamenError);
      }
      return NextResponse.json(
        { error: 'Error al guardar resultados' },
        { status: 500 }
      );
    }
    
    // Guardar las respuestas individuales en la tabla respuestas_estudiante
    const respuestasToInsert = answers.map((respuesta: Answer) => ({
      id: uuidv4(),
      resultado_id: resultadoExamen.id,
      pregunta_id: respuesta.pregunta_id,
      opcion_id: respuesta.opcion_id,
      es_correcta: respuesta.es_correcta,
      // Calcular puntaje_obtenido basado en si es correcta
      puntaje_obtenido: respuesta.es_correcta ? 
        parseFloat(preguntasHabilitadas.find((p: Pregunta) => p.id === respuesta.pregunta_id)?.puntaje || '0') : 0
    }));
    
    // Insertar respuestas en lotes para evitar errores por demasiadas inserciones
    const { error: respuestasError } = await supabase
      .from('respuestas_estudiante')
      .insert(respuestasToInsert);
    
    if (respuestasError) {
      if (DEBUG) {
        logger.error('Error al guardar respuestas individuales:', respuestasError);
      }
      // Aunque haya error en las respuestas, continuamos con el resto del proceso
      // para no perder los datos del resultado principal
    }

    // Ahora guardamos en examenes_escaneados con la referencia a resultados_examen
    interface ExamEscaneadoData {
      resultado_id: string;
      examen_id: string;
      archivo_original: string;
      archivo_procesado: string;
      ruta_s3_original: string;
      ruta_s3_procesado: string;
      fecha_escaneo: string;
      profesor_id?: string;
    }
    
    const examEscaneadoData: ExamEscaneadoData = {
      resultado_id: resultadoExamen.id,
      examen_id: examId,
      archivo_original: originalFileName,    // Guardar solo el nombre del archivo, no la ruta completa
      archivo_procesado: processedFileName,  // Guardar solo el nombre del archivo, no la ruta completa
      ruta_s3_original: s3OriginalPath,
      ruta_s3_procesado: s3ProcessedPath,
      fecha_escaneo: new Date().toISOString()
    };
    
    // Solo añadir profesor_id si lo tenemos
    if (profesorId) {
      examEscaneadoData.profesor_id = profesorId;
    }
    
    const { data: resultado, error: resultadoError } = await supabase
      .from('examenes_escaneados')
      .insert(examEscaneadoData)
      .select()
      .single();

    if (resultadoError) {
      if (DEBUG) {
        logger.error('Error al guardar resultados de escaneo:', resultadoError);
      }
      return NextResponse.json(
        { error: 'Error al guardar imágenes escaneadas' },
        { status: 500 }
      );
    }

    // After successful upload to S3, clean up the temporary files
    try {
      // Clean up temporary files in the file system
      if (processedImage && !processedImage.startsWith('data:')) {
        // Handle relative paths
        const processedPath = processedImage.startsWith('/') ? 
          `${process.cwd()}/public${processedImage}` : 
          processedImage;
        
        // Try to delete the file
        try {
          await _fsPromises.unlink(processedPath);
          if (DEBUG) {
            logger.log(`Deleted temporary processed image: ${processedPath}`);
          }
        } catch (err) {
          if (DEBUG) {
            logger.warn(`Could not delete processed image file ${processedPath}:`, err);
          }
        }
      }
      
      // Similar cleanup for original image if it's a file path
      if (originalImage && !originalImage.startsWith('data:')) {
        const originalPath = originalImage.startsWith('/') ? 
          `${process.cwd()}/public${originalImage}` : 
          originalImage;
        
        try {
          await _fsPromises.unlink(originalPath);
          if (DEBUG) {
            logger.log(`Deleted temporary original image: ${originalPath}`);
          }
        } catch (err) {
          if (DEBUG) {
            logger.warn(`Could not delete original image file ${originalPath}:`, err);
          }
        }
      }
      
      // Clean up any remaining files in the uploads directory
      await cleanupUploadsDirectory();
    } catch (cleanupError) {
      // Log but don't fail if cleanup has issues
      if (DEBUG) {
        logger.warn('Error during temporary file cleanup:', cleanupError);
      }
    }

    return NextResponse.json({
      success: true,
      resultado_id: resultadoExamen.id,
      resultado: {
        id: resultadoExamen.id,
        escaneo_id: resultado.id,
        nota: notaFinal,
        porcentaje: porcentajeCorrectas,
        respuestasCorrectas,
        totalPreguntas: preguntasHabilitadas.length,
        imagenes: {
          original: originalUrlData.publicUrl,
          procesada: processedUrlData.publicUrl
        }
      }
    });

  } catch (error: unknown) {
    if (DEBUG) {
      logger.error('Error en POST /api/exams/save-results:', error);
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 