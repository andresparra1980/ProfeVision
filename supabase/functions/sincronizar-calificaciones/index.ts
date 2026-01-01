import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'https://deno.land/x/jose@v5.9.6/index.ts';

interface RequestData {
  examId?: string;
}

// JWT verification (dual-mode: HS256 legacy + ES256 new)
async function verifyJWT(authHeader: string | null): Promise<jose.JWTPayload> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const jwtSecret = Deno.env.get('JWT_SECRET') || '';

  // Try ES256 first (new asymmetric keys via JWKS)
  try {
    const jwksUrl = `${supabaseUrl}/auth/v1/jwks`;
    const JWKS = jose.createRemoteJWKSet(new URL(jwksUrl));
    
    const { payload } = await jose.jwtVerify(token, JWKS, {
      audience: 'authenticated',
    });
    
    console.log('JWT verified via ES256 (new)');
    return payload;
  } catch (e) {
    console.log('ES256 verification failed, trying HS256:', e.message);
  }

  // Fallback to HS256 (legacy shared secret)
  if (jwtSecret) {
    try {
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jose.jwtVerify(token, secret, {
        algorithms: ['HS256'],
        audience: 'authenticated',
      });
      
      console.log('JWT verified via HS256 (legacy)');
      return payload;
    } catch (e) {
      throw new Error(`JWT verification failed: ${e.message}`);
    }
  }

  throw new Error('No JWT verification method available');
}

serve(async (req) => {
  try {
    // Verify JWT manually (function deployed with --no-verify-jwt)
    const authHeader = req.headers.get('Authorization');
    try {
      await verifyJWT(authHeader);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: `Unauthorized: ${e.message}` }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Crear cliente de Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtener datos de la petición
    const requestData: RequestData = await req.json();
    const { examId } = requestData;

    if (!examId) {
      return new Response(
        JSON.stringify({ error: 'Se requiere el ID del examen' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener vínculos del examen con componentes de calificación
    const { data: vinculos, error: vinculosError } = await supabase
      .from('examenes_a_componentes_calificacion')
      .select(`
        examen_id,
        componente_id,
        examen:examen_id (
          titulo,
          puntaje_total
        )
      `)
      .eq('examen_id', examId);
    
    if (vinculosError) {
      console.error('Error al obtener vínculos:', vinculosError);
      return new Response(
        JSON.stringify({ error: 'Error al obtener vínculos' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!vinculos || vinculos.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No hay vínculos para sincronizar' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Obtener resultados del examen
    const { data: resultadosExamen, error: resultadosError } = await supabase
      .from('resultados_examen')
      .select(`
        id,
        estudiante_id,
        puntaje_obtenido,
        porcentaje,
        examen_id
      `)
      .eq('examen_id', examId)
      .eq('estado', 'CALIFICADO');
    
    if (resultadosError) {
      console.error(`Error al obtener resultados del examen ${examId}:`, resultadosError);
      return new Response(
        JSON.stringify({ error: 'Error al obtener resultados del examen' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!resultadosExamen || resultadosExamen.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No hay resultados para este examen' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Procesar cada componente vinculado
    const resultados = [];
    
    for (const vinculo of vinculos) {
      const componenteId = vinculo.componente_id;
      
      // Procesar cada resultado de estudiante
      for (const resultado of resultadosExamen) {
        const estudianteId = resultado.estudiante_id;
        // Convertir porcentaje (0-100) a escala 0-5
        const calificacion = parseFloat(resultado.porcentaje) / 20;
        
        // Verificar si ya existe una calificación para este estudiante y componente
        const { data: calificacionExistente, error: calificacionError } = await supabase
          .from('calificaciones')
          .select('id')
          .eq('estudiante_id', estudianteId)
          .eq('componente_id', componenteId)
          .maybeSingle();
        
        if (calificacionError) {
          console.error(`Error al verificar calificación existente:`, calificacionError);
          continue;
        }
        
        // Si existe, actualizar; si no, insertar
        if (calificacionExistente) {
          const { error: updateError } = await supabase
            .from('calificaciones')
            .update({ valor: calificacion })
            .eq('id', calificacionExistente.id);
          
          if (updateError) {
            console.error(`Error al actualizar calificación:`, updateError);
          }
        } else {
          const { error: insertError } = await supabase
            .from('calificaciones')
            .insert({
              id: crypto.randomUUID(),
              estudiante_id: estudianteId,
              componente_id: componenteId,
              valor: calificacion
            });
          
          if (insertError) {
            console.error(`Error al insertar calificación:`, insertError);
          }
        }
      }
      
      resultados.push({ componente_id: componenteId, sincronizado: true });
    }
    
    return new Response(
      JSON.stringify({ 
        message: 'Sincronización completada', 
        resultados,
        examId
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error en sincronización de notas:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}); 