import { NextRequest, NextResponse } from 'next/server';
import { updateJobStatus } from '@/lib/services/exam-scan-service';

/**
 * Este endpoint recibe callbacks del microservicio OMR cuando finaliza el procesamiento
 * de una imagen escaneada. El microservicio enviará los resultados del procesamiento,
 * incluyendo datos extraídos del QR y las respuestas marcadas.
 * 
 * Firma esperada del callback:
 * {
 *   job_id: string;
 *   status: 'completed' | 'failed';
 *   error?: string;
 *   results?: {
 *     qr_data: {
 *       exam_id: string;
 *       student_id: string;
 *       group_id: string;
 *     };
 *     answers: Record<string, string>; // número de pregunta -> respuesta marcada (A, B, C, D)
 *   }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar la autorización - Usando API key simple
    const apiKey = req.headers.get('x-api-key');
    const configuredKey = process.env.OMR_SERVICE_API_KEY;
    
    if (configuredKey && apiKey !== configuredKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parsear el cuerpo de la solicitud
    const data = await req.json();
    
    if (!data.job_id) {
      return NextResponse.json(
        { error: 'Missing job_id' },
        { status: 400 }
      );
    }
    
    if (!data.status) {
      return NextResponse.json(
        { error: 'Missing status' },
        { status: 400 }
      );
    }
    
    // Formatear los resultados para nuestro almacenamiento
    let processingResults: any = null;
    
    if (data.status === 'completed' && data.results) {
      processingResults = {
        // Convertir snake_case a camelCase para mantener consistencia
        qrData: data.results.qr_data ? {
          examId: data.results.qr_data.exam_id,
          studentId: data.results.qr_data.student_id,
          groupId: data.results.qr_data.group_id,
        } : null,
        answers: data.results.answers || {},
        processedAt: new Date().toISOString(),
      };
      
      // Si hay resultados QR, actualizar el trabajo con estos datos
      if (processingResults.qrData) {
        processingResults.exam_id = processingResults.qrData.examId;
        processingResults.student_id = processingResults.qrData.studentId;
        processingResults.group_id = processingResults.qrData.groupId;
      }
    }
    
    // Actualizar el estado del trabajo
    await updateJobStatus(
      data.job_id,
      data.status === 'completed' ? 'completed' : 'failed',
      data.status === 'completed' ? processingResults : { error: data.error || 'Unknown error' }
    );
    
    // Si el trabajo se completó con éxito, podríamos guardar los resultados en otras tablas
    if (data.status === 'completed' && processingResults?.qrData) {
      // TODO: Aquí se podrían guardar las respuestas en la tabla de respuestas
      // y actualizar el progreso del estudiante
      console.log('Trabajo completado, resultados guardados:', processingResults);
    }
    
    // Responder con éxito
    return NextResponse.json({
      message: 'Callback received and processed successfully',
      jobId: data.job_id,
      status: data.status,
    });
    
  } catch (error) {
    console.error('Error processing OMR callback:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error processing callback' },
      { status: 500 }
    );
  }
} 