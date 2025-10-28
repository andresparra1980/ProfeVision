import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getApiTranslator } from '@/i18n/api';

const DEBUG = process.env.NODE_ENV === "development";

// Cache: 5 minutos
export const revalidate = 300;

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: (await getApiTranslator(request, 'dashboard')).t('errors.serverConfig') },
        { status: 500 }
      );
    }

    // Obtener el token de autorización del header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: (await getApiTranslator(request, 'dashboard')).t('errors.unauthorizedMissing') },
        { status: 401 }
      );
    }
    const token = authHeader.split(" ")[1];

    // Crear cliente de Supabase con service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verificar el token y obtener el usuario
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      if (DEBUG && authError) {
        console.error("Error de autenticación:", authError);
      }
      return NextResponse.json(
        { error: (await getApiTranslator(request, 'dashboard')).t('errors.unauthorized') },
        { status: 401 }
      );
    }

    const profesorId = user.id;

    // Ejecutar todas las queries en paralelo
    const [
      instituciones,
      materias,
      gruposData,
      estudiantesData,
      examenesRecientes,
      examenesCalificados
    ] = await Promise.all([
      // 1. Total Instituciones
      supabase
        .from('entidades_educativas')
        .select('*', { count: 'exact', head: true })
        .eq('profesor_id', profesorId),

      // 2. Total Materias
      supabase
        .from('materias')
        .select('*', { count: 'exact', head: true })
        .eq('profesor_id', profesorId),

      // 3. Grupos por Estado
      supabase
        .from('grupos')
        .select('estado')
        .eq('profesor_id', profesorId),

      // 4. Total Estudiantes Únicos
      supabase
        .from('estudiante_grupo')
        .select('estudiante_id, grupos!inner(profesor_id)')
        .eq('grupos.profesor_id', profesorId),

      // 5. Últimos 10 Exámenes
      supabase
        .from('examenes')
        .select('id, titulo, estado, fecha_creacion, materias(nombre)')
        .eq('profesor_id', profesorId)
        .order('fecha_creacion', { ascending: false })
        .limit(10),

      // 6. Exámenes Calificados (Escaneados)
      supabase
        .from('examenes_escaneados')
        .select('*', { count: 'exact', head: true })
        .eq('profesor_id', profesorId)
    ]);

    // Validar errores en las queries
    if (instituciones.error) {
      if (DEBUG) console.error("Error al obtener instituciones:", instituciones.error);
      return NextResponse.json(
        { error: (await getApiTranslator(request, 'dashboard')).t('errors.fetchData') },
        { status: 500 }
      );
    }

    if (materias.error) {
      if (DEBUG) console.error("Error al obtener materias:", materias.error);
      return NextResponse.json(
        { error: (await getApiTranslator(request, 'dashboard')).t('errors.fetchData') },
        { status: 500 }
      );
    }

    if (gruposData.error) {
      if (DEBUG) console.error("Error al obtener grupos:", gruposData.error);
      return NextResponse.json(
        { error: (await getApiTranslator(request, 'dashboard')).t('errors.fetchData') },
        { status: 500 }
      );
    }

    if (estudiantesData.error) {
      if (DEBUG) console.error("Error al obtener estudiantes:", estudiantesData.error);
      return NextResponse.json(
        { error: (await getApiTranslator(request, 'dashboard')).t('errors.fetchData') },
        { status: 500 }
      );
    }

    if (examenesRecientes.error) {
      if (DEBUG) console.error("Error al obtener exámenes recientes:", examenesRecientes.error);
      return NextResponse.json(
        { error: (await getApiTranslator(request, 'dashboard')).t('errors.fetchData') },
        { status: 500 }
      );
    }

    if (examenesCalificados.error) {
      if (DEBUG) console.error("Error al obtener exámenes calificados:", examenesCalificados.error);
      return NextResponse.json(
        { error: (await getApiTranslator(request, 'dashboard')).t('errors.fetchData') },
        { status: 500 }
      );
    }

    // Procesar datos
    const totalInstituciones = instituciones.count ?? 0;
    const totalMaterias = materias.count ?? 0;

    const gruposActivos = gruposData.data?.filter(g => g.estado === 'activo').length ?? 0;
    const gruposArchivados = gruposData.data?.filter(g => g.estado === 'archivado').length ?? 0;

    const totalEstudiantes = new Set(
      estudiantesData.data?.map(e => e.estudiante_id) || []
    ).size;

    const examenesCalificadosTotal = examenesCalificados.count ?? 0;
    const tiempoAhorradoSegundos = examenesCalificadosTotal * 295;

    // Formatear exámenes recientes y obtener grupos para cada uno
    const examenesRecientesFormatted = await Promise.all(
      (examenesRecientes.data ?? []).map(async (examen) => {
        const materias = examen.materias as unknown as { nombre: string } | null;

        // Obtener el primer grupo asignado a este examen
        const { data: aplicacion } = await supabase
          .from('aplicaciones_examen')
          .select('grupos(nombre)')
          .eq('examen_id', examen.id)
          .limit(1)
          .single();

        const grupo = aplicacion?.grupos as unknown as { nombre: string } | null;

        return {
          id: examen.id,
          titulo: examen.titulo,
          estado: examen.estado,
          fecha_creacion: examen.fecha_creacion,
          materia_nombre: materias?.nombre ?? null,
          grupo_nombre: grupo?.nombre ?? null
        };
      })
    );

    // Retornar respuesta
    return NextResponse.json({
      totalInstituciones,
      totalMaterias,
      gruposActivos,
      gruposArchivados,
      totalEstudiantes,
      examenesRecientes: examenesRecientesFormatted,
      examenesCalificados: examenesCalificadosTotal,
      tiempoAhorradoSegundos
    });

  } catch (error: unknown) {
    if (DEBUG) {
      console.error("Error al procesar la solicitud de estadísticas:", error);
    }
    return NextResponse.json(
      { error: (await getApiTranslator(request, 'dashboard')).t('errors.internal') },
      { status: 500 }
    );
  }
}
