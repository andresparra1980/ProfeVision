import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    // Obtener los datos en formato JSON
    const { imageData, filename, contentType, examId, studentId, groupId } = await req.json();
    
    if (!imageData) {
      return NextResponse.json(
        { error: 'No se proporcionó ninguna imagen' },
        { status: 400 }
      );
    }

    // Usar cliente admin con service role para bypassear RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }
    
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Generar un ID único para el trabajo
    const jobId = uuidv4();
    
    // Timestamp actual
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Definir el nombre del archivo basado en la información disponible
    let filePath: string;
    
    if (examId) {
      // Si tenemos el ID del examen, lo usamos en el nombre del archivo
      filePath = `exams/${examId}/scan_${timestamp}.png`;
    } else {
      // Si no tenemos el ID del examen, usamos el ID del trabajo
      filePath = `pending/scan_${jobId}_${timestamp}.png`;
    }
    
    // Convertir base64 a binario
    const base64Str = imageData; // Ya viene sin el prefijo data:image/*;base64,
    const buffer = Buffer.from(base64Str, 'base64');
    
    // Subir la imagen al bucket 'exam-scans'
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('exam-scans')
      .upload(filePath, buffer, {
        contentType: contentType || 'image/png',
        upsert: false
      });
    
    if (uploadError) {
      console.error('Error uploading scan to storage:', uploadError);
      return NextResponse.json(
        { error: `Error al subir la imagen: ${uploadError.message}` },
        { status: 500 }
      );
    }
    
    // Obtener la URL pública del archivo
    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from('exam-scans')
      .getPublicUrl(filePath);
    
    // Crear registro temporal (sin tabla exam_scan_jobs)
    // Para una implementación completa, necesitaríamos crear esta tabla 
    // y configurar sus políticas RLS adecuadamente

    // Para este ejemplo, vamos a retornar un ID de trabajo y la URL,
    // asumiendo que el procesamiento posterior se haría por otro servicio
    return NextResponse.json({
      status: 'processing',
      jobId: jobId,
      message: 'Imagen recibida y procesada correctamente',
      fileUrl: publicUrl,
    });

  } catch (error) {
    console.error('Error processing scan:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la imagen' },
      { status: 500 }
    );
  }
} 