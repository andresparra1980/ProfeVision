import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Manejar correctamente los parámetros en Next.js 14
    params = await Promise.resolve(params);
    const examId = params.id;
    
    if (!examId) {
      return NextResponse.json(
        { error: 'Se requiere ID del examen' },
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
    
    // Obtener preguntas del examen
    const { data: questions, error } = await supabase
      .from('preguntas')
      .select('id, texto, tipo_id, puntaje, dificultad, retroalimentacion, orden, habilitada')
      .eq('examen_id', examId)
      .order('orden');
    
    if (error) {
      console.error('Error al obtener preguntas:', error);
      return NextResponse.json(
        { error: 'Error al obtener preguntas del examen' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(questions || []);
    
  } catch (error) {
    console.error('Error inesperado:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 