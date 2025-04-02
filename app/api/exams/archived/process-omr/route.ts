import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

// Convertir exec a Promise
const execAsync = promisify(exec);

// Directorio para almacenar las imágenes temporalmente
const TEMP_DIR = path.join(process.cwd(), 'tmp');

// Asegurarse de que el directorio temporal existe
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Ruta al script OMR y su entorno virtual
const OMR_SCRIPT = path.join(process.cwd(), 'scripts/omr/omr_standalone.py');
const PYTHON_PATH = path.join(process.cwd(), 'scripts/omr/omr_env/bin/python');

export async function POST(req: Request) {
  try {
    // Obtener los datos en formato JSON
    const { imagePath, jobId, examId, studentId, groupId } = await req.json();
    
    if (!imagePath) {
      return NextResponse.json(
        { error: 'No se proporcionó ruta de imagen' },
        { status: 400 }
      );
    }

    console.log(`Procesando imagen: ${imagePath} para el examen: ${examId || 'N/A'}`);
    
    // Verificar si el script existe
    if (!fs.existsSync(OMR_SCRIPT)) {
      console.error(`Script OMR no encontrado en: ${OMR_SCRIPT}`);
      return NextResponse.json(
        { error: 'Script de procesamiento OMR no encontrado' },
        { status: 500 }
      );
    }
    
    // Verificar si el entorno Python existe
    if (!fs.existsSync(PYTHON_PATH)) {
      console.error(`Entorno Python no encontrado en: ${PYTHON_PATH}`);
      return NextResponse.json(
        { error: 'Entorno Python para OMR no encontrado' },
        { status: 500 }
      );
    }

    try {
      // Ejecutar el script OMR
      const command = `${PYTHON_PATH} ${OMR_SCRIPT} ${imagePath}`;
      console.log(`Ejecutando comando: ${command}`);
      
      // Verificar permisos de ejecución
      try {
        fs.accessSync(PYTHON_PATH, fs.constants.X_OK);
        console.log(`El intérprete Python tiene permisos de ejecución: ${PYTHON_PATH}`);
      } catch (accessError) {
        console.error(`El intérprete Python no tiene permisos de ejecución: ${PYTHON_PATH}`, accessError);
      }
      
      try {
        fs.accessSync(OMR_SCRIPT, fs.constants.R_OK);
        console.log(`El script OMR tiene permisos de lectura: ${OMR_SCRIPT}`);
      } catch (accessError) {
        console.error(`El script OMR no tiene permisos de lectura: ${OMR_SCRIPT}`, accessError);
      }
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        console.error(`Error en script OMR: ${stderr}`);
      }
      
      console.log(`Script OMR ejecutado con éxito, salida: ${stdout.slice(0, 100)}...`);
      
      // Parsear la salida JSON del script
      const omrResult = JSON.parse(stdout.trim());
      console.log('Resultado OMR:', omrResult);
      
      // Asegurar que omrResult siempre tenga un array answers, incluso en caso de error
      if (!omrResult.success) {
        console.log('Procesamiento OMR falló, analizando errores...');
        
        // Asegurar que existe un array answers vacío
        if (!omrResult.answers) {
          omrResult.answers = [];
        }
        
        // Extraer y clasificar información de error
        const errorDetails = {
          message: '',
          type: '',
          code: '',
          recommendations: [] as string[]
        };
        
        // Determinar tipo de error según la salida
        if (omrResult.error) {
          // Manejar caso específico de error de QR code
          if (omrResult.error.includes('No QR code found') || omrResult.error.includes('QR code data is empty')) {
            errorDetails.type = 'QR_NOT_FOUND';
            errorDetails.code = 'E002';
            errorDetails.message = 'No se pudo detectar el código QR en la imagen.';
            errorDetails.recommendations = [
              'Asegúrate de que el código QR es visible y no está dañado',
              'Mejora la iluminación para evitar sombras y reflejos',
              'Captura toda la hoja completa en la imagen',
              'Limpia la cámara si está borrosa o empañada'
            ];
          }
          // Manejar otros errores conocidos
          else if (omrResult.error.includes('markers') || omrResult.error.includes('corner')) {
            errorDetails.type = 'MARKER_DETECTION';
            errorDetails.code = 'E001';
            errorDetails.message = 'No se pudieron detectar los marcadores L en las esquinas.';
            errorDetails.recommendations = [
              'Asegúrate de que las cuatro esquinas de la hoja son visibles',
              'Evita doblar o cubrir las esquinas de la hoja',
              'Intenta con mejor iluminación y evita sombras en las esquinas',
              'La hoja debe estar sobre una superficie plana contrastante'
            ];
          }
          else if (omrResult.error.includes('alignment') || omrResult.error.includes('aligned')) {
            errorDetails.type = 'ALIGNMENT';
            errorDetails.code = 'E003';
            errorDetails.message = 'La hoja está torcida o desalineada.';
            errorDetails.recommendations = [
              'Coloca la hoja sobre una superficie plana',
              'Asegúrate de que la cámara esté paralela a la hoja',
              'Evita tomar la foto desde un ángulo',
              'No rotes ni dobles la hoja'
            ];
          }
          else if (omrResult.error.includes('no answers') || omrResult.error.includes('no bubbles')) {
            errorDetails.type = 'NO_ANSWERS';
            errorDetails.code = 'E004';
            errorDetails.message = 'No se pudieron detectar las respuestas marcadas.';
            errorDetails.recommendations = [
              'Verifica que las marcas estén bien rellenadas y sean oscuras',
              'Usa un lápiz del #2 o bolígrafo negro/azul oscuro',
              'Evita marcas débiles o parciales',
              'Mejora la iluminación para que las marcas sean visibles'
            ];
          }
          else if (omrResult.error.includes('threshold') || omrResult.error.includes('contrast')) {
            errorDetails.type = 'IMAGE_QUALITY';
            errorDetails.code = 'E005';
            errorDetails.message = 'La calidad de la imagen es insuficiente para el análisis.';
            errorDetails.recommendations = [
              'Usa una iluminación más uniforme, evita luces directas',
              'Limpia la lente de la cámara si está sucia',
              'Evita sombras sobre la hoja',
              'Asegúrate de que la hoja esté bien iluminada'
            ];
          }
          else {
            errorDetails.type = 'UNKNOWN_ERROR';
            errorDetails.code = 'E999';
            errorDetails.message = `Error en el procesamiento: ${omrResult.error}`;
            errorDetails.recommendations = [
              'Intenta con una nueva captura de la imagen',
              'Asegúrate de usar una hoja de respuestas válida y no dañada',
              'Verifica que la iluminación sea adecuada'
            ];
          }
        } 
        // Si no hay mensaje de error específico pero sabemos que falló
        else {
          // Análisis basado en los datos del resultado
          if (omrResult.total_questions === 0) {
            errorDetails.type = 'NO_QUESTIONS';
            errorDetails.code = 'E006';
            errorDetails.message = 'No se detectaron preguntas en la hoja de respuestas.';
            errorDetails.recommendations = [
              'Verifica que estás usando una hoja de respuestas correcta',
              'Asegúrate de que la hoja no esté rotada o invertida',
              'Captura la hoja completa en la imagen'
            ];
          }
          else if (omrResult.answered_questions === 0 && omrResult.total_questions > 0) {
            errorDetails.type = 'NO_ANSWERS_DETECTED';
            errorDetails.code = 'E007';
            errorDetails.message = 'Se detectaron preguntas pero no hay respuestas marcadas.';
            errorDetails.recommendations = [
              'Verifica que las respuestas estén claramente marcadas',
              'Las marcas deben ser lo suficientemente oscuras',
              'Evita marcas muy débiles o incompletas'
            ];
          }
          else if (omrResult.qr_data === '' || !omrResult.qr_data) {
            errorDetails.type = 'QR_DATA_MISSING';
            errorDetails.code = 'E008';
            errorDetails.message = 'El código QR se detectó pero no contiene datos válidos.';
            errorDetails.recommendations = [
              'El código QR podría estar dañado o parcialmente visible',
              'Evita reflejos sobre el código QR',
              'Intenta con mejor iluminación'
            ];
          }
          else {
            errorDetails.type = 'GENERAL_FAILURE';
            errorDetails.code = 'E000';
            errorDetails.message = 'Falló el procesamiento por razones desconocidas.';
            errorDetails.recommendations = [
              'Intenta con una nueva captura',
              'Asegúrate de usar una hoja de respuestas generada por el sistema',
              'Verifica la iluminación y posición de la hoja'
            ];
          }
        }
        
        // Añadir detalles de error al resultado
        omrResult.error_details = errorDetails;
        console.log('Detalles de error OMR:', errorDetails);
        
        // Añadir metadatos de imagen para diagnóstico
        try {
          const stats = fs.statSync(imagePath);
          omrResult.image_metadata = {
            size_bytes: stats.size,
            last_modified: stats.mtime,
            path: imagePath
          };
        } catch (statError) {
          console.error('No se pudo obtener metadatos de la imagen:', statError);
        }
      }
      
      // Usar cliente admin con service role para guardar resultados
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (supabaseUrl && serviceKey) {
        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });
        
        // Actualizar el registro de escaneo con los resultados
        if (jobId) {
          const { error: updateError } = await supabaseAdmin
            .from('exam_scans')
            .update({
              status: omrResult.success ? 'completed' : 'error',
              result: omrResult,
              updated_at: new Date().toISOString()
            })
            .eq('job_id', jobId);
          
          if (updateError) {
            console.error('Error al actualizar resultados en BD:', updateError);
          } else {
            console.log(`Resultados actualizados para job: ${jobId}`);
          }
        }
      }
      
      // Devolver el resultado del procesamiento
      return NextResponse.json({
        success: omrResult.success,
        jobId: jobId,
        examId: examId,
        result: omrResult,
        message: omrResult.success 
          ? 'Procesamiento OMR completado exitosamente' 
          : 'Error en procesamiento OMR',
        error_details: omrResult.error_details
      });
      
    } catch (execError: any) {
      console.error('Error ejecutando script OMR:', execError);
      
      // Crear un objeto de resultado para errores de ejecución
      const errorResult = {
        success: false,
        total_questions: 0,
        answered_questions: 0,
        answers: [],
        qr_data: '',
        error_message: execError.message || 'Error ejecutando el script OMR',
        error_details: {
          type: 'EXECUTION_ERROR',
          code: 'E500',
          message: 'El sistema no pudo ejecutar el procesamiento OMR.',
          stderr: execError.stderr || 'No hay detalles disponibles'
        }
      };
      
      return NextResponse.json(
        { 
          success: false,
          result: errorResult,
          error: `Error al ejecutar el script OMR: ${execError.message}`,
          error_details: errorResult.error_details
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error general en el procesamiento:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la imagen' },
      { status: 500 }
    );
  }
} 