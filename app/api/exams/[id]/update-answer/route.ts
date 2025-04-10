import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import _logger from '@/lib/utils/logger';

const DEBUG = process.env.NODE_ENV === 'development';

// Crear el cliente de Supabase para servidor
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// En Next.js 15, los params son un Promise
type Params = Promise<{ id: string }>;

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    // Resolver los params del Promise
    const resolvedParams = await params;
    const examId = resolvedParams.id;
    
    if (!examId) {
      return NextResponse.json(
        { error: 'ID de examen no proporcionado' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('respuestas_estudiantes')
      .update(await request.json())
      .eq('examen_id', examId)
      .select()
      .single();
      
    if (error) {
      if (DEBUG) {
        console.error('Error al actualizar respuesta:', error);
      }
      return NextResponse.json(
        { error: 'Error al actualizar la respuesta' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
    
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