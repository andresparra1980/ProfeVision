import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const DEBUG = process.env.NODE_ENV === 'development';

export async function POST() {
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
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    
    const { data: profesor, error: profesorError } = await supabase
      .from('profesores')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    if (profesorError) {
      if (DEBUG) {
        console.error('Error al obtener profesor:', profesorError);
      }
      return NextResponse.json(
        { error: 'Error al obtener datos del profesor' },
        { status: 500 }
      );
    }
    
    if (!profesor) {
      return NextResponse.json(
        { error: 'Profesor no encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ profesor });
    
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