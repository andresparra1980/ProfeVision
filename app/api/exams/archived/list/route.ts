import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const DEBUG = process.env.NODE_ENV === 'development';

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
    
    const { data: exams, error } = await supabase
      .from('examenes')
      .select('*')
      .eq('is_archived', true)
      .order('created_at', { ascending: false });
      
    if (error) {
      if (DEBUG) {
        console.error('Error al obtener exámenes archivados:', error);
      }
      return NextResponse.json(
        { error: 'Error al obtener exámenes archivados' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(exams);
    
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