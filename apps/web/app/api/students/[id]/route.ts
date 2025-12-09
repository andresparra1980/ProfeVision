import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import _logger from '@/lib/utils/logger';
import { getApiTranslator } from '@/i18n/api';

export const dynamic = 'force-dynamic';

// En Next.js 15, los params son un Promise
type Params = Promise<{ id: string }>;

export async function GET(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { t } = await getApiTranslator(req, 'students.id');
    // Resolver los params del Promise
    const resolvedParams = await params;
    const studentId = resolvedParams.id;
    
    if (!studentId) {
      return NextResponse.json(
        { error: t('errors.missingId') },
        { status: 400 }
      );
    }
    
    // Inicializar cliente Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: t('errors.serverConfig') },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });
    
    // Consultar el estudiante con las columnas correctas según la estructura real de la tabla
    const { data: student, error } = await supabase
      .from('estudiantes')
      .select('*')  // Seleccionar todas las columnas para evitar errores de columnas inexistentes
      .eq('id', studentId)
      .single();
    
    if (error) {
      console.error('Error al obtener detalles del estudiante:', error);
      return NextResponse.json(
        { error: t('errors.fetch') },
        { status: 500 }
      );
    }
    
    if (!student) {
      return NextResponse.json(
        { error: t('errors.notFound') },
        { status: 404 }
      );
    }
    
    // Crear un objeto con la información del estudiante
    // Adaptando a los nombres de columna que realmente existen
    const studentInfo = {
      id: student.id,
      nombres: student.nombres,
      apellidos: student.apellidos,
      identificacion: student.identificacion,
      email: student.email || null
    };
    
    return NextResponse.json(studentInfo);
    
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    return NextResponse.json(
      { error: (await getApiTranslator(req, 'students.id')).t('errors.internal') },
      { status: 500 }
    );
  }
} 