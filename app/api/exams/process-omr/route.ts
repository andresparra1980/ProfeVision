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
          : 'Error en procesamiento OMR'
      });
      
    } catch (execError: any) {
      console.error('Error ejecutando script OMR:', execError);
      return NextResponse.json(
        { 
          error: `Error al ejecutar el script OMR: ${execError.message}`,
          details: execError.stderr || 'No hay detalles disponibles'
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