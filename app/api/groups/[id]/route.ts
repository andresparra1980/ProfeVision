import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Manejar correctamente los parámetros en Next.js 14
    params = await Promise.resolve(params);
    const groupId = params.id;
    
    if (!groupId) {
      return NextResponse.json(
        { error: 'ID de grupo no proporcionado' },
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
    
    // Obtener grupo con todas las columnas para evitar errores
    const { data: group, error } = await supabase
      .from('grupos')
      .select('*')
      .eq('id', groupId)
      .single();
    
    if (error) {
      console.error('Error al obtener detalles del grupo:', error);
      return NextResponse.json(
        { error: 'Error al obtener detalles del grupo' },
        { status: 500 }
      );
    }
    
    if (!group) {
      return NextResponse.json(
        { error: 'Grupo no encontrado' },
        { status: 404 }
      );
    }
    
    // Buscar la materia asociada, si existe una relación
    let subjectData = null;
    if (group.materia_id) {
      const { data: subject, error: subjectError } = await supabase
        .from('materias')
        .select('*')
        .eq('id', group.materia_id)
        .single();
      
      if (!subjectError && subject) {
        subjectData = subject;
      } else if (subjectError) {
        console.error('Error al obtener materia del grupo:', subjectError);
      }
    }
    
    // Preparar respuesta
    const response = {
      ...group,
      materia: subjectData
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 