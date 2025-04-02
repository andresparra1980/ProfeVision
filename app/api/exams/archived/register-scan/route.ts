import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { decodeQRData, DecodedQRData } from '@/lib/utils/qr-code';

// Función para imprimir partes de una clave de manera segura (solo para debugging)
function safeLogKey(key: string | undefined): string {
  if (!key) return 'undefined';
  if (key.length < 10) return '***too_short***';
  return `${key.substring(0, 5)}...${key.substring(key.length - 5)}`;
}

// Función para determinar si la service role key es válida
async function validateServiceRole(supabaseUrl: string, serviceKey: string) {
  try {
    // Crear un cliente temporal para validar
    const tempClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Intentar una operación que solo service_role puede hacer
    const { data, error } = await tempClient.rpc('get_service_role_status');
    
    if (error) {
      console.error('Error validando service role:', error);
      return false;
    }
    
    console.log('Validación de service role exitosa:', data);
    return true;
  } catch (err) {
    console.error('Error en validación service role:', err);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // Obtener datos del escaneo
    let { 
      jobId, 
      imagePath, 
      examId = null,
      studentId = null, 
      groupId = null,
      qrData = null,  // Nuevo campo para datos del QR raw
      omrResult = null // Resultado completo del OMR para almacenar
    } = await request.json();

    // Validar datos mínimos requeridos
    if (!jobId || !imagePath) {
      return NextResponse.json(
        { error: 'Se requiere jobId e imagePath' },
        { status: 400 }
      );
    }

    console.log('Registrando escaneo:', { 
      jobId, 
      imagePath, 
      examId, 
      studentId, 
      groupId,
      qrDataPresent: !!qrData
    });

    // Procesar datos del QR si están disponibles
    let decodedQR: DecodedQRData | null = null;
    let qrMetadata = null;
    
    if (qrData) {
      decodedQR = decodeQRData(qrData);
      
      if (decodedQR) {
        console.log('QR decodificado correctamente:', {
          isValid: decodedQR.isValid,
          examId: decodedQR.examId,
          studentId: decodedQR.studentId,
          groupId: decodedQR.groupId || 'N/A'
        });
        
        // Usar los datos del QR si no se proveyeron explícitamente
        if (!examId && decodedQR.examId) examId = decodedQR.examId;
        if (!studentId && decodedQR.studentId) studentId = decodedQR.studentId;
        if (!groupId && decodedQR.groupId) groupId = decodedQR.groupId;
        
        qrMetadata = {
          raw: qrData,
          decoded: {
            isValid: decodedQR.isValid,
            examId: decodedQR.examId,
            studentId: decodedQR.studentId,
            groupId: decodedQR.groupId,
            hash: decodedQR.hash
          }
        };
      } else {
        console.warn('No se pudo decodificar el QR:', qrData);
        qrMetadata = {
          raw: qrData,
          decoded: null,
          error: 'Formato QR no reconocido'
        };
      }
    }

    // Preparar metadata para almacenar
    const metadata = {
      source: 'web_scanner_sql',
      qr: qrMetadata,
      omr: omrResult ? {
        success: omrResult.success,
        total_questions: omrResult.total_questions,
        answered_questions: omrResult.answered_questions,
        timestamp: new Date().toISOString()
      } : null
    };

    // ======== MÉTODO DIRECTO CON SQL ========
    // Probar inserción directa con SQL para evitar RLS
    try {
      // Inicializar cliente
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      // Información de debugging
      console.log('Supabase URL:', supabaseUrl || 'no configurada');
      console.log('Service Key status:', safeLogKey(supabaseServiceKey));
      
      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Variables de entorno de Supabase no están configuradas correctamente');
        return NextResponse.json(
          { error: 'Error de configuración del servidor: Credenciales de Supabase faltantes' },
          { status: 500 }
        );
      }
      
      // Crear cliente de Supabase con opciones explícitas
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        }
      });
      
      console.log('Cliente Supabase Admin creado correctamente');
      
      // Usar SQL directo para insertar (bypassing RLS)
      try {
        const { data: sqlData, error: sqlError } = await supabaseAdmin.rpc('insert_exam_scan', {
          p_job_id: jobId,
          p_image_path: imagePath,
          p_exam_id: examId,
          p_student_id: studentId,
          p_group_id: groupId,
          p_metadata: JSON.stringify(metadata)
        });
        
        if (sqlError) {
          console.error('Error al guardar con SQL directo:', sqlError);
          
          // Si la función RPC no existe, continuamos con otros métodos
          if (sqlError.message.includes('function') && sqlError.message.includes('does not exist')) {
            console.log('Función SQL no existe, intentando con método tradicional...');
            // Continuar con el siguiente método
          } else {
            // Si es otro tipo de error, reportarlo y seguir con métodos alternativos
            console.error('Error específico con SQL directo, intentando método alternativo');
          }
        } else {
          console.log('Inserción exitosa con SQL directo:', sqlData);
          return NextResponse.json({
            message: 'Escaneo registrado exitosamente mediante SQL directo',
            scanId: sqlData.id || sqlData,
            jobId: jobId,
            status: 'in_queue',
            qrValid: decodedQR?.isValid
          });
        }
      } catch (sqlRpcError) {
        console.error('Error al llamar RPC:', sqlRpcError);
        // Continuar con el siguiente método
      }
      
      // ======== MÉTODO BYPASS CON INSERT DIRECTO ========
      // Si SQL directo no funciona, intentar con el método bypass
      try {
        console.log('Intentando método bypass...');
        
        // Intento 1: Inserción completa
        const { data: bypassData, error: bypassError } = await supabaseAdmin
          .from('exam_scans')
          .insert({
            job_id: jobId,
            image_path: imagePath,
            exam_id: examId,
            student_id: studentId,
            group_id: groupId,
            status: 'pending',
            metadata: metadata
          })
          .select('id, job_id');
          
        if (bypassError) {
          console.error('Error con método bypass:', bypassError);
          
          // Intento 2: Inserción estándar
          console.log('Intentando método estándar...');
          const { data: standardData, error: standardError } = await supabaseAdmin
            .from('exam_scans')
            .insert({
              job_id: jobId,
              image_path: imagePath,
              exam_id: examId,
              student_id: studentId,
              group_id: groupId,
              status: 'pending',
              metadata: metadata
            })
            .select('id, job_id')
            .single();
          
          if (standardError) {
            console.error('Error con método estándar:', standardError);
            
            // Intento 3: Inserción mínima (último recurso)
            console.log('Intentando inserción mínima...');
            const { data: minimalData, error: minimalError } = await supabaseAdmin
              .from('exam_scans')
              .insert({
                job_id: jobId,
                image_path: imagePath,
                status: 'pending',
                metadata: {
                  source: 'web_scanner_minimal',
                  qr: qrMetadata
                }
              })
              .select('id, job_id')
              .single();
              
            if (minimalError) {
              console.error('Error también con inserción mínima:', minimalError);
              return NextResponse.json(
                { error: `Error persistente de RLS: ${minimalError.message}. Contacta al administrador.` },
                { status: 500 }
              );
            }
            
            console.log('Inserción mínima exitosa:', minimalData);
            return NextResponse.json({
              message: 'Escaneo registrado (modo mínimo)',
              scanId: minimalData.id,
              jobId: minimalData.job_id,
              status: 'pending',
              qrValid: decodedQR?.isValid
            });
          }
          
          console.log('Inserción estándar exitosa:', standardData);
          return NextResponse.json({
            message: 'Escaneo registrado exitosamente',
            scanId: standardData.id,
            jobId: standardData.job_id,
            status: 'pending',
            qrValid: decodedQR?.isValid
          });
        }
        
        console.log('Inserción bypass exitosa:', bypassData);
        
        // Actualizar el estado a in_queue
        const { error: updateError } = await supabaseAdmin
          .from('exam_scans')
          .update({ status: 'in_queue' })
          .eq('job_id', jobId);
          
        if (updateError) {
          console.warn('Error al actualizar estado a in_queue:', updateError);
        }
        
        return NextResponse.json({
          message: 'Escaneo registrado exitosamente con bypass',
          scanId: bypassData[0]?.id,
          jobId: jobId,
          status: 'in_queue',
          qrValid: decodedQR?.isValid
        });
      } catch (bypassError: any) {
        console.error('Error grave al intentar bypass:', bypassError);
        return NextResponse.json(
          { error: `Error con métodos alternativos: ${bypassError.message}` },
          { status: 500 }
        );
      }
    } catch (supabaseError: any) {
      console.error('Error al interactuar con Supabase:', supabaseError);
      return NextResponse.json(
        { error: `Error de comunicación con Supabase: ${supabaseError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error en el endpoint de registro de escaneo:', error);
    return NextResponse.json(
      { error: `Error interno del servidor: ${error.message || 'Desconocido'}` },
      { status: 500 }
    );
  }
} 