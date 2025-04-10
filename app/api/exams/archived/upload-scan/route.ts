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
    const studentId = formData.get('studentId') as string;
    const groupId = formData.get('groupId') as string;
    
    if (!file || !examId || !studentId || !groupId) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
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
        exam_id: examId,
        student_id: studentId,
        group_id: groupId
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