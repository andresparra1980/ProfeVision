import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { questionIds } = await req.json();
    
    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de IDs de preguntas' },
        { status: 400 }
      );
    }
    
    // Inicializar cliente Supabase
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
        persistSession: false,
      }
    });
    
    // Obtener opciones de respuesta para las preguntas especificadas
    const { data: optionsData, error } = await supabase
      .from('opciones_respuesta')
      .select('*')
      .in('pregunta_id', questionIds);
    
    if (error) {
      console.error('Error al obtener opciones de respuesta:', error);
      return NextResponse.json(
        { error: 'Error al obtener opciones de respuesta' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(optionsData || []);
    
  } catch (error) {
    console.error('Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 