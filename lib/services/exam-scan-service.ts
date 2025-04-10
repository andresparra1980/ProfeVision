import { getServiceSupabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const DEBUG = process.env.NODE_ENV === 'development';

interface ScanData {
  examId: string; // puede ser null si aún no se ha procesado el QR
  studentId?: string;
  groupId?: string;
  timestamp: string;
}

interface ProcessingResult {
  jobId: string;
  uploadUrl: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  scanData: ScanData;
}

interface OmrServiceCallbackData {
  job_id: string;
  file_url: string;
  callback_url: string;
  metadata: {
    exam_id: string | null;
    student_id: string | null;
    group_id: string | null;
  };
}

/**
 * Sube una imagen escaneada a Supabase Storage y crea un trabajo de procesamiento
 * @param file Archivo de imagen para procesar
 * @param examId ID opcional del examen
 * @returns Resultado del procesamiento
 */
export async function uploadScanToStorage(
  file: File | Blob,
  examId?: string,
  studentId?: string,
  groupId?: string
): Promise<ProcessingResult> {
  const supabase = getServiceSupabase();
  
  // Generar un ID único para el trabajo
  const jobId = uuidv4();
  
  // Timestamp actual
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Definir el nombre del archivo basado en la información disponible
  let fileName: string;
  let filePath: string;
  
  if (examId) {
    // Si tenemos el ID del examen, lo usamos en el nombre del archivo
    fileName = `scan_${examId}_${timestamp}.png`;
    filePath = `exams/${examId}/${fileName}`;
  } else {
    // Si no tenemos el ID del examen, usamos el ID del trabajo
    fileName = `scan_${jobId}_${timestamp}.png`;
    filePath = `pending/${fileName}`;
  }
  
  // Subir la imagen al bucket 'exam-scans'
  const { error: uploadError } = await supabase
    .storage
    .from('exam-scans')
    .upload(filePath, file, {
      contentType: 'image/png',
      upsert: false
    });
  
  if (uploadError) {
    if (DEBUG) {
      console.error('Error uploading scan to storage:', uploadError);
    }
    throw new Error(`Error uploading scan: ${uploadError.message}`);
  }
  
  // Obtener la URL pública del archivo
  const { data: { publicUrl } } = supabase
    .storage
    .from('exam-scans')
    .getPublicUrl(filePath);
  
  // Crear un registro en la tabla 'exam_scan_jobs'
  const scanData: ScanData = {
    examId: examId || '',
    studentId,
    groupId,
    timestamp: new Date().toISOString(),
  };
  
  const { error: jobError } = await supabase
    .from('exam_scan_jobs')
    .insert({
      id: jobId,
      exam_id: examId || null,
      student_id: studentId || null,
      group_id: groupId || null,
      file_path: filePath,
      status: 'queued',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (jobError) {
    if (DEBUG) {
      console.error('Error creating scan job record:', jobError);
    }
    throw new Error(`Error creating scan job: ${jobError.message}`);
  }
  
  // Notificar al microservicio de OMR
  await notifyOmrService(jobId, filePath, scanData);
  
  return {
    jobId,
    uploadUrl: publicUrl,
    status: 'queued',
    scanData,
  };
}

/**
 * Notifica al microservicio de OMR que hay un nuevo trabajo para procesar
 * @param jobId ID del trabajo
 * @param filePath Ruta del archivo en Supabase Storage
 * @param scanData Datos del escaneo
 */
async function notifyOmrService(
  jobId: string, 
  filePath: string, 
  scanData: ScanData
): Promise<void> {
  try {
    const omrServiceEndpoint = process.env.OMR_SERVICE_ENDPOINT;
    
    if (!omrServiceEndpoint) {
      if (DEBUG) {
        console.log('OMR service endpoint not configured. Job queued:', { jobId, filePath });
      }
      return;
    }
    
    // Obtener URL firmada para que el microservicio pueda acceder a la imagen
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .storage
      .from('exam-scans')
      .createSignedUrl(filePath, 60 * 60); // 1 hora de validez
    
    if (error || !data) {
      if (DEBUG) {
        console.error('Error creating signed URL:', error);
      }
      throw new Error(`Error creating signed URL: ${error?.message || 'Unknown error'}`);
    }
    
    const signedUrl = data.signedUrl;
    
    // Enviar solicitud al microservicio
    const payload: OmrServiceCallbackData = {
      job_id: jobId,
      file_url: signedUrl,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/omr/callback`,
      metadata: {
        exam_id: scanData.examId || null,
        student_id: scanData.studentId || null,
        group_id: scanData.groupId || null,
      }
    };
    
    const response = await fetch(omrServiceEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OMR_SERVICE_API_KEY || ''}`,
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`Error notifying OMR service: ${response.statusText}`);
    }
    
    if (DEBUG) {
      console.log('OMR service notified successfully:', jobId);
    }
  } catch (error: unknown) {
    if (DEBUG) {
      console.error('Error notifying OMR service:', error);
    }
    // No lanzamos error para no interrumpir el flujo, pero registramos el problema
  }
}

/**
 * Obtiene el estado de un trabajo de procesamiento
 * @param jobId ID del trabajo
 * @returns Datos del trabajo o null si no existe
 */
export async function getProcessingJob(jobId: string): Promise<ProcessingResult | null> {
  const supabase = getServiceSupabase();
  
  const { data, error } = await supabase
    .from('exam_scan_jobs')
    .select(`
      id,
      exam_id,
      student_id,
      group_id,
      file_path,
      status,
      created_at,
      completed_at,
      result,
      error
    `)
    .eq('id', jobId)
    .single();
  
  if (error || !data) {
    if (DEBUG) {
      console.error('Error fetching scan job:', error);
    }
    return null;
  }
  
  // Obtener URL pública del archivo
  const { data: { publicUrl } } = supabase
    .storage
    .from('exam-scans')
    .getPublicUrl(data.file_path);
  
  return {
    jobId: data.id,
    uploadUrl: publicUrl,
    status: data.status as 'queued' | 'processing' | 'completed' | 'failed',
    scanData: {
      examId: data.exam_id || '',
      studentId: data.student_id,
      groupId: data.group_id,
      timestamp: data.created_at,
    },
  };
}

/**
 * Actualiza el estado de un trabajo de procesamiento
 * @param jobId ID del trabajo
 * @param status Nuevo estado
 * @param result Resultado del procesamiento (opcional)
 */
export async function updateJobStatus(
  jobId: string, 
  status: 'processing' | 'completed' | 'failed',
  result?: Record<string, unknown>
): Promise<void> {
  const supabase = getServiceSupabase();
  
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  
  if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
    updates.result = result;
    
    // Si el resultado incluye el ID del examen, estudiante o grupo, actualizamos esos campos
    if (result?.exam_id) updates.exam_id = result.exam_id;
    if (result?.student_id) updates.student_id = result.student_id;
    if (result?.group_id) updates.group_id = result.group_id;
  } else if (status === 'failed') {
    updates.error = result?.error || 'Unknown error';
  }
  
  const { error } = await supabase
    .from('exam_scan_jobs')
    .update(updates)
    .eq('id', jobId);
  
  if (error) {
    if (DEBUG) {
      console.error('Error updating scan job status:', error);
    }
    throw new Error(`Error updating job status: ${error.message}`);
  }
} 