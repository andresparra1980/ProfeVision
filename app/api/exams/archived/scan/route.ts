import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const DEBUG = process.env.NODE_ENV === 'development';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const examId = formData.get('examId') as string;
    
    if (!file || !examId) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo o ID de examen' },
        { status: 400 }
      );
    }
    
    const jobId = uuidv4();
    const imagePath = `scans/${jobId}.jpg`;
    
    const { error: uploadError } = await supabase.storage
      .from('exam-scans')
      .upload(imagePath, file);
      
    if (uploadError) {
      if (DEBUG) {
        console.error('Error al subir archivo:', uploadError);
      }
      return NextResponse.json(
        { error: 'Error al subir archivo' },
        { status: 500 }
      );
    }
    
    const { error: insertError } = await supabase
      .from('escaneos_examen')
      .insert({
        id: jobId,
        ruta_imagen: imagePath,
        estado: 'pending',
        exam_id: examId
      });
      
    if (insertError) {
      if (DEBUG) {
        console.error('Error al registrar escaneo:', insertError);
      }
      return NextResponse.json(
        { error: 'Error al registrar escaneo' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ jobId });
    
  } catch (error: unknown) {
    if (DEBUG) {
      console.error('Error al procesar la solicitud:', error);
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 