import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const DEBUG = process.env.NODE_ENV === 'development';

// Endpoint de diagnóstico para verificar que las rutas base de API están accesibles
export async function GET() {
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
    
    const { data, error } = await supabase
      .from('examenes')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      if (DEBUG) {
        console.error('API /exams GET: Error al obtener exámenes:', error);
      }
      return NextResponse.json(
        { error: 'Error al obtener los exámenes' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
    
  } catch (error: unknown) {
    if (DEBUG) {
      console.error('API /exams GET: Error:', error);
    }
    return NextResponse.json({
      error: 'Error al obtener los exámenes',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
    
    const body = await request.json();
    const { title, description, questions, materia_id } = body;
    
    if (!title || !questions || !materia_id) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('examenes')
      .insert({
        title,
        description,
        questions,
        materia_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) {
      if (DEBUG) {
        console.error('API /exams POST: Error al crear examen:', error);
      }
      return NextResponse.json(
        { error: 'Error al crear examen' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
    
  } catch (error: unknown) {
    if (DEBUG) {
      console.error('API /exams POST: Error:', error);
    }
    return NextResponse.json({
      error: 'Error al crear el examen',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 