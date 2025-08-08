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
    // Resolver los params del Promise
    const resolvedParams = await params;
    const groupId = resolvedParams.id;
    
    const { t } = await getApiTranslator(req, 'groups.id');
    if (!groupId) {
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
    
    // Obtener grupo con todas las columnas para evitar errores
    const { data: group, error } = await supabase
      .from('grupos')
      .select('*')
      .eq('id', groupId)
      .single();
    
    if (error) {
      console.error('Error al obtener detalles del grupo:', error);
      return NextResponse.json(
        { error: t('errors.fetch') },
        { status: 500 }
      );
    }
    
    if (!group) {
      return NextResponse.json(
        { error: t('errors.notFound') },
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
      { error: (await getApiTranslator(req, 'groups.id')).t('errors.internal') },
      { status: 500 }
    );
  }
} 