import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    
    const { jobId } = await request.json();
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'No se proporcionó jobId' },
        { status: 400 }
      );
    }
    
    const { data: scanData, error: scanError } = await supabase
      .from('escaneos_examen')
      .select('*')
      .eq('id', jobId)
      .single();
      
    if (scanError) {
      if (DEBUG) {
        console.error('Error al obtener datos del escaneo:', scanError);
      }
      return NextResponse.json(
        { error: 'Error al obtener datos del escaneo' },
        { status: 500 }
      );
    }
    
    if (!scanData) {
      return NextResponse.json(
        { error: 'Escaneo no encontrado' },
        { status: 404 }
      );
    }
    
    const { error: updateError } = await supabase
      .from('escaneos_examen')
      .update({ estado: 'processing' })
      .eq('id', jobId);
      
    if (updateError) {
      if (DEBUG) {
        console.error('Error al actualizar estado del escaneo:', updateError);
      }
      return NextResponse.json(
        { error: 'Error al actualizar estado del escaneo' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message: 'Escaneo en proceso' });
    
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