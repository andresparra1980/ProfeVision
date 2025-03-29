import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

// Función de ayuda para imprimir de forma segura las claves (solo primeros/últimos caracteres)
function safeLogKey(key: string | undefined, name: string) {
  if (!key) {
    console.log(`${name}: undefined`);
    return;
  }
  
  if (key.length <= 8) {
    console.log(`${name}: *******`);
    return;
  }
  
  // Solo mostrar primeros 4 caracteres y últimos 4 caracteres para verificar
  console.log(`${name}: ${key.substring(0, 4)}...${key.substring(key.length - 4)}`);
}

// Log de depuración
console.log("========== VARIABLES DE ENTORNO ==========");
safeLogKey(process.env.NEXT_PUBLIC_SUPABASE_URL, "SUPABASE_URL");
safeLogKey(process.env.SUPABASE_SERVICE_ROLE_KEY, "SERVICE_KEY");
safeLogKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "ANON_KEY");
console.log("=========================================");

// Directorio para almacenar las imágenes
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads');

// Asegurarse de que el directorio existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function POST(req: NextRequest) {
  try {
    console.log("API de subida iniciada");
    // Obtener datos de la solicitud
    const body = await req.json();
    const { imageData, contentType, examId, studentId, groupId } = body;
    
    if (!imageData) {
      return NextResponse.json(
        { error: 'No se proporcionó ninguna imagen' },
        { status: 400 }
      );
    }

    // Generar un ID único para el trabajo
    const jobId = uuidv4();
    
    // Timestamp actual
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Definir el nombre del archivo
    const filename = `scan_${jobId}_${timestamp}.png`;
    const filePath = path.join(UPLOAD_DIR, filename);
    
    // Extraer la parte de datos de base64 (eliminar el prefijo si existe)
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Guardar la imagen en el sistema de archivos local
    fs.writeFileSync(filePath, buffer);
    
    // Generar URL para acceso público
    const publicUrl = `/uploads/${filename}`;
    console.log(`Imagen guardada en: ${filePath}`);
    
    // Usar cliente admin con service role para guardar en BD
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    let scanId;
    
    if (supabaseUrl && serviceKey) {
      const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      // Crear registro en la tabla exam_scans
      const { data: scanData, error: insertError } = await supabaseAdmin
        .from('exam_scans')
        .insert({
          job_id: jobId,
          exam_id: examId || null,
          student_id: studentId || null,
          group_id: groupId || null,
          image_path: filePath,
          public_url: publicUrl,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (insertError) {
        console.error('Error al registrar en BD:', insertError);
      } else {
        scanId = scanData?.id;
        console.log(`Registro creado en BD con ID: ${scanId}`);
      }
    }
    
    // Llamar al endpoint de procesamiento OMR
    try {
      const omrResponse = await fetch(new URL('/api/exams/process-omr', req.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imagePath: filePath,
          jobId: jobId,
          examId: examId,
          studentId: studentId,
          groupId: groupId
        }),
      });
      
      if (!omrResponse.ok) {
        const errorData = await omrResponse.json();
        console.error('Error al procesar imagen con OMR:', errorData);
      }
      
      const omrResult = await omrResponse.json();
      
      // Devolver la URL de la imagen y el resultado del procesamiento
      return NextResponse.json({
        success: true,
        jobId: jobId,
        scanId: scanId,
        fileUrl: publicUrl,
        omrResult: omrResult
      });
      
    } catch (omrError) {
      console.error('Error al llamar al servicio OMR:', omrError);
      
      // Si hay error en el procesamiento OMR, igualmente devolvemos la URL de la imagen
      return NextResponse.json({
        success: true,
        jobId: jobId,
        scanId: scanId,
        fileUrl: publicUrl,
        omrError: 'Error al procesar la imagen con OMR. Intente de nuevo más tarde.'
      });
    }
    
  } catch (error: any) {
    console.error('Error general en la API:', error);
    return NextResponse.json(
      { error: `Error inesperado: ${error.message}` },
      { status: 500 }
    );
  }
} 