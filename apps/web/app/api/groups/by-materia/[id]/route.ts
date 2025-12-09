import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import _logger from '@/lib/utils/logger';
import { Estudiante } from '@/lib/types/database';
import { getApiTranslator } from '@/i18n/api';

export const dynamic = 'force-dynamic';

// En Next.js 15, los params son un Promise
type Params = Promise<{ id: string }>;

// Define interfaces for type safety
interface EstudianteGrupo {
  estudiante: Estudiante;
}

const DEBUG = process.env.NODE_ENV === 'development';

// Crear cliente de Supabase para el servidor usando SERVICE_ROLE_KEY
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    // Obtener el token de autorización del header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: (await getApiTranslator(req, 'groups.by-materia.id')).t('errors.unauthorized') }, { status: 401 });
    }

    // Resolver los params del Promise
    const resolvedParams = await params;
    const materiaId = resolvedParams.id;

    // Obtener grupos por materia_id
    const { data: grupos, error } = await supabase
      .from('grupos')
      .select(`
        *,
        materia:materias (
          nombre
        ),
        estudiantes:estudiante_grupo (
          estudiante:estudiantes (
            id,
            nombres,
            apellidos,
            email
          )
        )
      `)
      .eq('materia_id', materiaId)
      .single();

    if (error) throw error;

    // Transformar el resultado para que coincida con la interfaz ExamGroup
    const grupoFormateado = {
      ...grupos,
      estudiantes: grupos.estudiantes.map((e: EstudianteGrupo) => ({
        id: e.estudiante.id,
        nombre: e.estudiante.nombres,
        apellido: e.estudiante.apellidos,
        email: e.estudiante.email
      }))
    };

    return NextResponse.json(grupoFormateado);
  } catch (error: unknown) {
    if (DEBUG) {
      console.error('API /groups/by-materia/[id]: Error:', error);
    }
    return NextResponse.json({
      error: (await getApiTranslator(req, 'groups.by-materia.id')).t('errors.internal'),
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 