import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // Obtener los datos de la solicitud
    const body = await request.json();
    const { 
      nombre, 
      tipo,
      profesorId,
      userEmail 
    } = body;

    // Validar datos mínimos
    if (!nombre || !profesorId) {
      return NextResponse.json({ error: 'Nombre y profesorId son requeridos' }, { status: 400 });
    }

    // Configuración del cliente de Supabase Admin usando variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Verificar que tenemos los datos de conexión
    if (!supabaseUrl || !serviceKey) {
      console.error('Error: Faltan variables de entorno para Supabase');
      return NextResponse.json({ 
        error: 'Error de configuración del servidor' 
      }, { status: 500 });
    }
    
    try {
      // Usar SQL directo para evitar RLS completamente
      // Crear un cliente de servicio para supabase
      const supabaseAdmin = createClient(supabaseUrl, serviceKey);
      
      // 1. Primero verificar si ya existe el profesor
      const { data: professorData, error: professorQueryError } = await supabaseAdmin
        .rpc('check_profesor_exists', { p_id: profesorId });
      
      // Si hay un error o el profesor no existe, crearlo
      if (professorQueryError || !professorData) {
        console.log('Verificando profesor mediante RPC:', professorQueryError || 'No existe');
        
        // Crear el profesor usando la función RPC segura
        const { data: newProfesor, error: createProfesorError } = await supabaseAdmin
          .rpc('crear_profesor_mejorado', { 
            p_id: profesorId, 
            p_email: userEmail || `usuario-${profesorId.substring(0, 8)}@example.com` 
          });
        
        if (createProfesorError) {
          console.error('Error al crear profesor:', createProfesorError);
          return NextResponse.json({ error: 'No se pudo crear el perfil del profesor' }, { status: 500 });
        }
        
        console.log('Profesor creado con éxito');
      } else {
        console.log('Profesor existe:', professorData);
      }
      
      // 2. Crear la entidad educativa mediante SQL directo para eludir RLS
      const { data: entityResult, error: entityError } = await supabaseAdmin
        .rpc('crear_entidad_educativa', { 
          p_nombre: nombre, 
          p_tipo: tipo || '' 
        });
      
      if (entityError || !entityResult) {
        console.error('Error al crear entidad educativa:', entityError);
        return NextResponse.json({ error: 'Error al crear la institución educativa' }, { status: 500 });
      }
      
      const entityId = entityResult;
      console.log('Entidad creada con ID:', entityId);
      
      // 3. Crear la relación profesor-entidad mediante SQL directo
      const { data: relationResult, error: relationError } = await supabaseAdmin
        .rpc('crear_relacion_profesor_entidad', { 
          p_profesor_id: profesorId, 
          p_entidad_id: entityId, 
          p_es_admin: true 
        });
      
      if (relationError || !relationResult) {
        console.error('Error al crear relación profesor-entidad:', relationError);
        return NextResponse.json({ 
          error: 'Se creó la institución pero hubo un problema al asignarla' 
        }, { status: 500 });
      }
      
      // 4. Obtener los datos de la entidad creada para retornarlos
      const { data: entityData, error: fetchError } = await supabaseAdmin
        .from('entidades_educativas')
        .select('*')
        .eq('id', entityId)
        .single();
        
      if (fetchError) {
        console.error('Error al obtener datos de la entidad:', fetchError);
        // No fallamos aquí, solo registramos el error
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Institución educativa creada correctamente',
        entity: entityData || { id: entityId, nombre, tipo }
      });
    } catch (error: any) {
      console.error('Error inesperado:', error);
      return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('Error en la API:', error);
    return NextResponse.json({ error: error.message || 'Error en el servidor' }, { status: 500 });
  }
} 