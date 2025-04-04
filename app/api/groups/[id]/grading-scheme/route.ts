import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database';
import { GradingScheme } from '@/lib/types/grading';

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    // Obtener datos de la petición
    const scheme: GradingScheme = await request.json();
    const { id: groupId } = await Promise.resolve(context.params);

    // Inicializar cliente Supabase con service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Error: Faltan variables de entorno para Supabase');
      return NextResponse.json({ 
        error: 'Error de configuración del servidor' 
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verificar que el grupo existe
    const { data: grupo, error: grupoError } = await supabase
      .from('grupos')
      .select('profesor_id')
      .eq('id', groupId)
      .single();

    if (grupoError) {
      console.error('Error al verificar grupo:', grupoError);
      return NextResponse.json(
        { error: 'No se pudo verificar el acceso al grupo' },
        { status: 403 }
      );
    }

    if (!grupo) {
      return NextResponse.json(
        { error: 'Grupo no encontrado' },
        { status: 404 }
      );
    }

    // Validar los periodos
    for (const periodo of scheme.periodos) {
      // Validar que las fechas estén establecidas
      if (!periodo.fecha_inicio || !periodo.fecha_fin) {
        return NextResponse.json(
          { error: `Las fechas son requeridas para el periodo "${periodo.nombre}"` },
          { status: 400 }
        );
      }

      // Validar que la fecha de fin sea posterior a la de inicio
      if (new Date(periodo.fecha_fin) <= new Date(periodo.fecha_inicio)) {
        return NextResponse.json(
          { error: `La fecha de fin debe ser posterior a la fecha de inicio en el periodo "${periodo.nombre}"` },
          { status: 400 }
        );
      }
    }

    // Si no hay ID, es un nuevo esquema
    if (!scheme.id) {
      // Validar que las fechas estén presentes
      if (!scheme.fecha_inicio || !scheme.fecha_fin) {
        return NextResponse.json(
          { error: 'Las fechas de inicio y fin son requeridas' },
          { status: 400 }
        );
      }

      // Validar que la fecha de fin sea posterior a la de inicio
      if (new Date(scheme.fecha_fin) <= new Date(scheme.fecha_inicio)) {
        return NextResponse.json(
          { error: 'La fecha de fin debe ser posterior a la fecha de inicio' },
          { status: 400 }
        );
      }
      
      // Crear esquema
      const { data: newScheme, error: schemeError } = await supabase
        .from('esquemas_calificacion')
        .insert({ 
          grupo_id: groupId,
          nombre: scheme.nombre || 'Esquema de Calificación',
          fecha_inicio: scheme.fecha_inicio,
          fecha_fin: scheme.fecha_fin,
          es_activo: true
        })
        .select()
        .single();

      if (schemeError) {
        console.error('Error al crear esquema:', schemeError);
        throw schemeError;
      }

      if (!newScheme) {
        throw new Error('No se pudo crear el esquema');
      }

      scheme.id = newScheme.id;
    }

    // Actualizar o crear periodos
    for (const periodo of scheme.periodos) {
      if (!periodo.id) {
        // Crear nuevo periodo
        const { data: newPeriod, error: periodError } = await supabase
          .from('periodos_calificacion')
          .insert({
            nombre: periodo.nombre,
            porcentaje: periodo.porcentaje,
            orden: periodo.orden,
            esquema_id: scheme.id,
            fecha_inicio: periodo.fecha_inicio,
            fecha_fin: periodo.fecha_fin
          })
          .select()
          .single();

        if (periodError) {
          console.error('Error al crear periodo:', periodError);
          throw periodError;
        }

        if (!newPeriod) {
          throw new Error('No se pudo crear el periodo');
        }

        periodo.id = newPeriod.id;

        // Crear componentes del nuevo periodo
        for (const componente of periodo.componentes) {
          const { error: componentError } = await supabase
            .from('componentes_calificacion')
            .insert({
              nombre: componente.nombre,
              porcentaje: componente.porcentaje,
              periodo_id: periodo.id,
              tipo: componente.tipo
            });

          if (componentError) {
            console.error('Error al crear componente:', componentError);
            throw componentError;
          }
        }
      } else {
        // Actualizar periodo existente
        const { error: periodError } = await supabase
          .from('periodos_calificacion')
          .update({
            nombre: periodo.nombre,
            porcentaje: periodo.porcentaje,
            orden: periodo.orden,
            fecha_inicio: periodo.fecha_inicio,
            fecha_fin: periodo.fecha_fin
          })
          .eq('id', periodo.id);

        if (periodError) {
          console.error('Error al actualizar periodo:', periodError);
          throw periodError;
        }

        // Eliminar componentes que ya no existen
        const componentIds = periodo.componentes.map(c => c.id).filter(Boolean);
        if (componentIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('componentes_calificacion')
            .delete()
            .eq('periodo_id', periodo.id)
            .not('id', 'in', `(${componentIds.join(',')})`);

          if (deleteError) {
            console.error('Error al eliminar componentes:', deleteError);
            throw deleteError;
          }
        }

        // Actualizar o crear componentes
        for (const componente of periodo.componentes) {
          if (!componente.id) {
            // Crear nuevo componente
            const { error: componentError } = await supabase
              .from('componentes_calificacion')
              .insert({
                nombre: componente.nombre,
                porcentaje: componente.porcentaje,
                periodo_id: periodo.id,
                tipo: componente.tipo
              });

            if (componentError) {
              console.error('Error al crear componente:', componentError);
              throw componentError;
            }
          } else {
            // Actualizar componente existente
            const { error: componentError } = await supabase
              .from('componentes_calificacion')
              .update({
                nombre: componente.nombre,
                porcentaje: componente.porcentaje,
                tipo: componente.tipo
              })
              .eq('id', componente.id);

            if (componentError) {
              console.error('Error al actualizar componente:', componentError);
              throw componentError;
            }
          }
        }
      }
    }

    // Eliminar periodos que ya no existen
    const periodIds = scheme.periodos.map(p => p.id).filter(Boolean);
    if (periodIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('periodos_calificacion')
        .delete()
        .eq('esquema_id', scheme.id)
        .not('id', 'in', `(${periodIds.join(',')})`);

      if (deleteError) {
        console.error('Error al eliminar periodos:', deleteError);
        throw deleteError;
      }
    }

    // Cargar el esquema actualizado
    const { data: updatedScheme, error: loadError } = await supabase
      .from('esquemas_calificacion')
      .select(`
        id,
        grupo_id,
        nombre,
        fecha_inicio,
        fecha_fin,
        periodos:periodos_calificacion(
          id,
          nombre,
          porcentaje,
          orden,
          fecha_inicio,
          fecha_fin,
          componentes:componentes_calificacion(
            id,
            nombre,
            porcentaje,
            tipo
          )
        )
      `)
      .eq('id', scheme.id)
      .single();

    if (loadError) {
      console.error('Error al cargar esquema actualizado:', loadError);
      throw loadError;
    }

    return NextResponse.json(updatedScheme);
  } catch (error) {
    console.error('Error al guardar esquema:', error);
    return NextResponse.json(
      { error: 'Error al guardar el esquema de calificaciones' },
      { status: 500 }
    );
  }
} 