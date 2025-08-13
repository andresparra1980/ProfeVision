import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getApiTranslator } from '@/i18n/api';

const DEBUG = process.env.NODE_ENV === "development";

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: (await getApiTranslator(request, 'entities')).t('errors.serverConfig') },
        { status: 500 }
      );
    }

    // Obtener el token de autorización del header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: (await getApiTranslator(request, 'entities')).t('errors.unauthorizedMissing') },
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
      return NextResponse.json({ error: (await getApiTranslator(request, 'entities')).t('errors.unauthorized') }, { status: 401 });
    }

    // Obtener los datos del request
    const requestData = await request.json();

    // Crear la entidad educativa incluyendo el profesor_id
    const { data: entidad, error: entidadError } = await supabase
      .from("entidades_educativas")
      .insert([
        {
          nombre: requestData.nombre,
          tipo: requestData.tipo,
          profesor_id: user.id,
        },
      ])
      .select()
      .single();

    if (entidadError) {
      if (DEBUG) {
        console.error("Error al crear entidad:", entidadError);
      }
      return NextResponse.json(
        { error: (await getApiTranslator(request, 'entities')).t('errors.createEntity') },
        { status: 500 }
      );
    }

    // Crear la relación profesor-entidad
    const { error: relError } = await supabase.from("profesor_entidad").insert([
      {
        profesor_id: user.id,
        entidad_id: entidad.id,
        rol: "Administrador",
      },
    ]);

    if (relError) {
      if (DEBUG) {
        console.error("Error al crear relación profesor-entidad:", relError);
      }
      // Si falla la relación, eliminamos la entidad creada
      await supabase.from("entidades_educativas").delete().eq("id", entidad.id);

      return NextResponse.json(
        { error: (await getApiTranslator(request, 'entities')).t('errors.relateEntity') },
        { status: 500 }
      );
    }

    return NextResponse.json({ entidad });
  } catch (error: unknown) {
    if (DEBUG) {
      console.error("Error al procesar la solicitud:", error);
    }
    return NextResponse.json(
      { error: (await getApiTranslator(request, 'entities')).t('errors.internal') },
      { status: 500 }
    );
  }
}
