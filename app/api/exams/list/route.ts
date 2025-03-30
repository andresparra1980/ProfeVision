import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  console.log('API /exams/list: Iniciando solicitud');
  
  try {
    // Configuración de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('API /exams/list: Error - Variables de entorno faltantes');
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }
    
    // Crear cliente de Supabase
    console.log('API /exams/list: Creando cliente Supabase');
    console.log(`API URL: ${supabaseUrl.substring(0, 15)}...`);
    console.log(`API Service Key presente: ${supabaseServiceKey ? 'Sí' : 'No'}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Consultar los exámenes
    console.log('API /exams/list: Consultando todos los exámenes');
    
    const { data: exams, error } = await supabase
      .from('examenes')
      .select('id, titulo, descripcion, materia_id, estado, duracion_minutos, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('API /exams/list: Error SQL:', error);
      return NextResponse.json(
        { error: `Error en la consulta: ${error.message}` },
        { status: 500 }
      );
    }
    
    console.log(`API /exams/list: Encontrados ${exams?.length || 0} exámenes`);
    
    if (!exams || exams.length === 0) {
      return NextResponse.json({ exams: [] });
    }
    
    return NextResponse.json({ 
      exams,
      count: exams.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('API /exams/list: Error general:', error);
    return NextResponse.json(
      { error: `Error interno del servidor: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    );
  }
} 