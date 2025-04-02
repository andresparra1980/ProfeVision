import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

// Configuración para el cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Configuración para el bucket S3
const s3BucketName = process.env.S3_BUCKET_NAME || 'examenes-escaneados';

// Función auxiliar para comprimir imágenes
async function compressImage(imageBase64: string, quality: number = 80, maxSize: number = 1000): Promise<Buffer> {
  try {
    // Extraer los datos base64 después del prefijo
    let base64Data = imageBase64;
    let format: 'jpeg' | 'png' = 'jpeg';
    let contentType = '';
    
    // Detectar formato basado en el encabezado data URI
    if (imageBase64.startsWith('data:image/')) {
      const matches = imageBase64.match(/^data:image\/([a-zA-Z]+);base64,/);
      if (matches && matches.length > 1) {
        const detectedFormat = matches[1].toLowerCase();
        contentType = `image/${detectedFormat}`;
        if (detectedFormat === 'png' || detectedFormat === 'jpeg' || detectedFormat === 'jpg') {
          format = detectedFormat === 'jpg' ? 'jpeg' : detectedFormat as 'jpeg' | 'png';
        }
      }
      base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    }
    
    // Decodificar la cadena base64 a un buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Imprimir información para depuración
    console.log(`Comprimiendo imagen: formato=${format}, tamaño original=${buffer.length} bytes`);
    
    // Verificar que el buffer no está vacío
    if (buffer.length < 100) {
      throw new Error('Buffer de imagen demasiado pequeño para comprimir');
    }
    
    // Utilizar sharp para comprimir la imagen con opciones agresivas
    const processedImage = sharp(buffer);
    
    // Obtener metadatos para conocer el tamaño original
    const metadata = await processedImage.metadata();
    const width = metadata.width || 1200;
    const height = metadata.height || 1600;
    
    // Si la imagen es muy grande, redimensionarla manteniendo la proporción
    if (width > maxSize || height > maxSize) {
      const aspectRatio = width / height;
      const newWidth = width > height ? maxSize : Math.round(maxSize * aspectRatio);
      const newHeight = height > width ? maxSize : Math.round(maxSize / aspectRatio);
      
      processedImage.resize({
        width: newWidth,
        height: newHeight,
        fit: 'inside',
        withoutEnlargement: true
      });
      
      console.log(`Redimensionando imagen de ${width}x${height} a ${newWidth}x${newHeight}`);
    }
    
    // Aplicar opciones de compresión según el formato
    if (format === 'jpeg') {
      // Configuración agresiva para JPEG
      processedImage.jpeg({
        quality: quality,
        progressive: true,
        optimiseCoding: true,
        trellisQuantisation: true,
        overshootDeringing: true,
        mozjpeg: true,            // Usar compresión mozjpeg para mejor resultado
        chromaSubsampling: '4:2:0' // Reducir información de color
      });
    } else {
      // Configuración para PNG
      processedImage.png({
        quality: quality,
        compressionLevel: 9,      // Nivel de compresión máximo
        adaptiveFiltering: true,  // Filtrado adaptativo para mejor compresión
        palette: true             // Usar paleta de colores para reducir tamaño
      });
    }
    
    // Generar el buffer comprimido
    const compressedBuffer = await processedImage.toBuffer();
    
    console.log(`Imagen comprimida: tamaño final=${compressedBuffer.length} bytes, reducción=${Math.round((1 - compressedBuffer.length / buffer.length) * 100)}%`);
    
    return compressedBuffer;
  } catch (error) {
    console.error('Error al comprimir imagen:', error);
    // Si falla la compresión, devolvemos el buffer original
    const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    return buffer;
  }
}

// Limpiar archivos temporales en public/uploads si existen
async function cleanupTemporaryFiles() {
  const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads', 'omr');
  
  try {
    // Verificar si el directorio existe
    await fs.access(publicUploadsDir);
    
    // Leer todos los archivos en el directorio
    const files = await fs.readdir(publicUploadsDir);
    
    // Obtener la fecha actual
    const now = Date.now();
    
    // Eliminar archivos más antiguos que 1 hora (3600000 ms)
    const deletePromises = files.map(async (file) => {
      const filePath = path.join(publicUploadsDir, file);
      
      try {
        const stats = await fs.stat(filePath);
        const fileAge = now - stats.mtime.getTime();
        
        // Si el archivo es más antiguo que 1 hora o si tiene extensión .jpg o .jpeg
        if (fileAge > 3600000 || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')) {
          await fs.unlink(filePath);
          console.log(`Archivo temporal eliminado: ${filePath}`);
        }
      } catch (error) {
        console.error(`Error al procesar archivo ${filePath}:`, error);
      }
    });
    
    await Promise.all(deletePromises);
  } catch (error) {
    // Si el directorio no existe o hay otro error, lo registramos pero continuamos
    console.error('Error al limpiar archivos temporales:', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { 
      qrData, 
      answers, 
      originalImage, 
      processedImage, 
      examScore,
      isDuplicate,
      duplicateInfo
    } = data;

    if (!qrData || !answers || !originalImage || !processedImage || !examScore) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    // Extraer información del QR
    const examId = qrData.examId || qrData.examenId || qrData.exam_id || qrData.examen_id;
    const studentId = qrData.studentId || qrData.estudianteId || qrData.student_id || qrData.estudiante_id;
    const groupId = qrData.groupId || qrData.grupoId || qrData.group_id || qrData.grupo_id;
    let profesorId = qrData.profesorId || qrData.profesor_id;
    
    if (!examId || !studentId) {
      return NextResponse.json({ error: 'Datos de QR incompletos' }, { status: 400 });
    }

    // Inicializar cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });
    
    // Si no tenemos profesorId, intentamos obtenerlo del examen
    if (!profesorId) {
      try {
        const { data: examenData, error: examenError } = await supabase
          .from('examenes')
          .select('profesor_id')
          .eq('id', examId)
          .single();
          
        if (examenError || !examenData?.profesor_id) {
          return NextResponse.json({ 
            error: 'No se pudo obtener el profesor asociado al examen' 
          }, { status: 400 });
        }
        
        profesorId = examenData.profesor_id;
      } catch (error) {
        return NextResponse.json({ 
          error: 'Error al obtener información del profesor' 
        }, { status: 500 });
      }
    }

    // Si es un reescaneo, eliminar los resultados anteriores
    if (isDuplicate && duplicateInfo && duplicateInfo.resultadoId) {
      console.log(`Eliminando resultado anterior: ${duplicateInfo.resultadoId}`);
      
      try {
        // 1. Obtener información de las imágenes a eliminar
        const { data: escaneoData, error: escaneoError } = await supabase
          .from('examenes_escaneados')
          .select('ruta_s3_original, ruta_s3_procesado')
          .eq('resultado_id', duplicateInfo.resultadoId)
          .maybeSingle();
          
        if (!escaneoError && escaneoData) {
          // 2. Eliminar imágenes del storage
          if (escaneoData.ruta_s3_original) {
            const { error: deleteOriginalError } = await supabase
              .storage
              .from(s3BucketName)
              .remove([escaneoData.ruta_s3_original]);
              
            if (deleteOriginalError) {
              console.error('Error al eliminar imagen original:', deleteOriginalError);
            }
          }
          
          if (escaneoData.ruta_s3_procesado) {
            const { error: deleteProcessedError } = await supabase
              .storage
              .from(s3BucketName)
              .remove([escaneoData.ruta_s3_procesado]);
              
            if (deleteProcessedError) {
              console.error('Error al eliminar imagen procesada:', deleteProcessedError);
            }
          }
          
          // 3. Eliminar registro de escaneo
          const { error: deleteEscaneoError } = await supabase
            .from('examenes_escaneados')
            .delete()
            .eq('resultado_id', duplicateInfo.resultadoId);
            
          if (deleteEscaneoError) {
            console.error('Error al eliminar registro de escaneo:', deleteEscaneoError);
          }
        }
        
        // 4. Eliminar respuestas del estudiante
        const { error: deleteRespuestasError } = await supabase
          .from('respuestas_estudiante')
          .delete()
          .eq('resultado_id', duplicateInfo.resultadoId);
          
        if (deleteRespuestasError) {
          console.error('Error al eliminar respuestas:', deleteRespuestasError);
        }
        
        // 5. Eliminar resultado del examen
        const { error: deleteResultadoError } = await supabase
          .from('resultados_examen')
          .delete()
          .eq('id', duplicateInfo.resultadoId);
          
        if (deleteResultadoError) {
          console.error('Error al eliminar resultado:', deleteResultadoError);
        }
        
      } catch (error) {
        console.error('Error al eliminar resultados anteriores:', error);
        // Continuamos con el proceso aunque haya error en la eliminación
      }
    }

    // 1. Crear un nuevo registro en resultados_examen
    const resultadoId = uuidv4();
    const now = new Date().toISOString();
    
    // Buscar si existe una versión para este examen
    let versionId = null;
    try {
      const { data: versionData, error: versionError } = await supabase
        .from('versiones_examen')
        .select('id')
        .eq('examen_id', examId)
        .order('created_at', { ascending: false })
        .maybeSingle();
      
      versionId = versionData?.id;
      
      if (!versionId) {
        console.log('No se encontró versión para este examen, continuando con version_id = null');
      }
    } catch (error) {
      console.log('Error al buscar versión, continuando con version_id = null:', error);
    }
    
    // Crear el resultado del examen
    const { data: resultadoData, error: resultadoError } = await supabase
      .from('resultados_examen')
      .insert({
        id: resultadoId,
        estudiante_id: studentId,
        version_id: versionId,
        puntaje_obtenido: examScore.correctAnswers,
        porcentaje: examScore.percentage,
        estado: 'CALIFICADO',
        fecha_calificacion: now,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();
    
    if (resultadoError) {
      console.error('Error al guardar resultado de examen:', resultadoError);
      return NextResponse.json(
        { error: 'Error al guardar resultado de examen: ' + resultadoError.message },
        { status: 500 }
      );
    }
    
    // 2. Guardar las respuestas del estudiante
    const respuestasPromises = [];
    
    for (const answer of answers) {
      // Obtener id de la pregunta basado en su orden
      const { data: preguntaData, error: preguntaError } = await supabase
        .from('preguntas')
        .select('id')
        .eq('examen_id', examId)
        .eq('orden', answer.number)
        .single();
      
      if (preguntaError) {
        console.error(`Error al obtener pregunta orden ${answer.number}:`, preguntaError);
        continue;
      }
      
      const preguntaId = preguntaData?.id;
      
      // Obtener id de la opción seleccionada
      let letraRespuesta = '';
      switch (answer.value.toUpperCase()) {
        case 'A': letraRespuesta = '1'; break;
        case 'B': letraRespuesta = '2'; break;
        case 'C': letraRespuesta = '3'; break;
        case 'D': letraRespuesta = '4'; break;
        case 'E': letraRespuesta = '5'; break;
        case 'F': letraRespuesta = '6'; break;
        case 'G': letraRespuesta = '7'; break;
        case 'H': letraRespuesta = '8'; break;
        default: letraRespuesta = '1';
      }
      
      const { data: opcionData, error: opcionError } = await supabase
        .from('opciones_respuesta')
        .select('id, es_correcta')
        .eq('pregunta_id', preguntaId)
        .eq('orden', letraRespuesta)
        .single();
      
      if (opcionError) {
        console.error(`Error al obtener opción para pregunta ${preguntaId}:`, opcionError);
        continue;
      }
      
      const opcionId = opcionData?.id;
      const esCorrecta = opcionData?.es_correcta || false;
      
      // Agregar promesa para insertar respuesta de estudiante
      respuestasPromises.push(
        supabase
          .from('respuestas_estudiante')
          .insert({
            resultado_id: resultadoId,
            pregunta_id: preguntaId,
            opcion_id: opcionId,
            es_correcta: esCorrecta,
            puntaje_obtenido: esCorrecta ? 1 : 0,
            created_at: now,
            updated_at: now
          })
      );
    }
    
    // Ejecutar todas las promesas de inserción de respuestas
    await Promise.all(respuestasPromises);
    
    // 3. Subir imágenes a S3 usando el Storage API de Supabase
    // Generar rutas para las imágenes
    const timestamp = now.replace(/[:.]/g, '-');
    const jobId = uuidv4();
    
    // Rutas para guardar en Storage - Estructura simplificada
    const originalPath = `examenes-escaneados/${profesorId}/${examId}/${jobId}_original_${timestamp}.png`;
    const processedPath = `examenes-escaneados/${profesorId}/${examId}/${jobId}_processed_${timestamp}.png`;
    
    // Validar formato de las imágenes
    if (!originalImage || typeof originalImage !== 'string') {
      return NextResponse.json({ error: 'La imagen original no es válida' }, { status: 400 });
    }
    
    if (!processedImage || typeof processedImage !== 'string') {
      return NextResponse.json({ error: 'La imagen procesada no es válida' }, { status: 400 });
    }
    
    // Obtener los tipos de contenido
    let originalContentType = 'image/png';
    if (originalImage.startsWith('data:image/jpeg') || originalImage.startsWith('data:image/jpg')) {
      originalContentType = 'image/jpeg';
    } else if (!originalImage.startsWith('data:image/')) {
      return NextResponse.json({ 
        error: 'La imagen original debe ser un string base64 con formato data:image/*;base64,' 
      }, { status: 400 });
    }
    
    let processedContentType = 'image/png';
    if (processedImage.startsWith('data:image/jpeg') || processedImage.startsWith('data:image/jpg')) {
      processedContentType = 'image/jpeg';
    } else if (!processedImage.startsWith('data:image/')) {
      return NextResponse.json({ 
        error: 'La imagen procesada debe ser un string base64 con formato data:image/*;base64,' 
      }, { status: 400 });
    }
    
    // Verificar que las imágenes parecen ser cadenas base64 válidas
    if (!originalImage.includes('base64,')) {
      return NextResponse.json({ error: 'La imagen original no contiene el marcador base64,' }, { status: 400 });
    }
    
    if (!processedImage.includes('base64,')) {
      return NextResponse.json({ error: 'La imagen procesada no contiene el marcador base64,' }, { status: 400 });
    }
    
    if (originalImage.length < 100) {
      return NextResponse.json({ error: 'La imagen original es demasiado pequeña para ser válida' }, { status: 400 });
    }
    
    if (processedImage.length < 100) {
      return NextResponse.json({ error: 'La imagen procesada es demasiado pequeña para ser válida' }, { status: 400 });
    }
    
    try {
      // Comprimir la imagen original antes de subirla
      console.log('Comprimiendo imagen original...');
      // Calidad menor para la imagen original (es solo para archivo)
      const compressedOriginalBuffer = await compressImage(originalImage, 60, 800);
      
      console.log(`Imagen original comprimida: ${compressedOriginalBuffer.length} bytes`);
      
      const { data: originalData, error: originalError } = await supabase
        .storage
        .from(s3BucketName)
        .upload(originalPath, compressedOriginalBuffer, {
          contentType: originalContentType,
          cacheControl: '3600'
        });
      
      if (originalError) {
        console.error('Error al subir imagen original:', originalError);
        return NextResponse.json(
          { error: 'Error al subir imagen original: ' + originalError.message },
          { status: 500 }
        );
      }
      
      // Comprimir la imagen procesada
      console.log('Comprimiendo imagen procesada...');
      // Mayor calidad para la imagen procesada para preservar las marcas
      const compressedProcessedBuffer = await compressImage(processedImage, 75, 1000);
      
      console.log(`Imagen procesada comprimida: ${compressedProcessedBuffer.length} bytes`);
      
      // Verificar que el buffer no esté vacío
      if (compressedProcessedBuffer.length < 100) {
        console.error('Buffer de imagen procesada demasiado pequeño:', compressedProcessedBuffer.length);
        return NextResponse.json(
          { error: 'La imagen procesada parece estar corrupta o vacía' },
          { status: 400 }
        );
      }
      
      const { data: processedData, error: processedError } = await supabase
        .storage
        .from(s3BucketName)
        .upload(processedPath, compressedProcessedBuffer, {
          contentType: processedContentType,
          cacheControl: '3600'
        });
      
      if (processedError) {
        console.error('Error al subir imagen procesada:', processedError);
        return NextResponse.json(
          { error: 'Error al subir imagen procesada' },
          { status: 500 }
        );
      }
      
      // Obtener URLs públicas
      const { data: originalUrlData } = await supabase
        .storage
        .from(s3BucketName)
        .getPublicUrl(originalPath);
      
      const { data: processedUrlData } = await supabase
        .storage
        .from(s3BucketName)
        .getPublicUrl(processedPath);
      
      const originalUrl = originalUrlData.publicUrl;
      const processedUrl = processedUrlData.publicUrl;
      
      // 4. Guardar registro en examenes_escaneados
      const { data: escaneoData, error: escaneoError } = await supabase
        .from('examenes_escaneados')
        .insert({
          profesor_id: profesorId,
          examen_id: examId,
          resultado_id: resultadoId,
          archivo_original: `${jobId}_original_${timestamp}.png`,
          archivo_procesado: `${jobId}_processed_${timestamp}.png`,
          ruta_s3_original: originalPath,
          ruta_s3_procesado: processedPath,
          fecha_escaneo: now,
          created_at: now,
          updated_at: now
        })
        .select()
        .single();
      
      if (escaneoError) {
        console.error('Error al guardar registro de escaneo:', escaneoError);
        return NextResponse.json(
          { error: 'Error al guardar registro de escaneo' },
          { status: 500 }
        );
      }
      
      // 5. También actualizar la tabla exam_scans existente
      const { data: scanData, error: scanError } = await supabase
        .from('exam_scans')
        .insert({
          job_id: jobId,
          image_path: processedPath,
          exam_id: examId,
          student_id: studentId,
          group_id: groupId,
          status: 'COMPLETED',
          result: {
            score: examScore.percentage,
            correctAnswers: examScore.correctAnswers,
            totalQuestions: examScore.totalQuestions,
            answers: answers
          },
          metadata: {
            originalImage: originalPath,
            processedImage: processedPath,
            resultadoId: resultadoId
          },
          created_at: now,
          updated_at: now
        })
        .select()
        .single();

      // 6. Limpiar archivos temporales
      await cleanupTemporaryFiles();

      return NextResponse.json({
        success: true,
        resultado_id: resultadoId,
        image_paths: {
          original: originalUrl,
          processed: processedUrl
        }
      });
      
    } catch (error) {
      console.error('Error al procesar las imágenes:', error);
      return NextResponse.json(
        { error: `Error al procesar las imágenes: ${error instanceof Error ? error.message : 'Error desconocido'}` },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 