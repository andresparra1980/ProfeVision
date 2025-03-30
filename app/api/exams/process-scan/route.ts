import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs, statSync } from 'fs';
import os from 'os';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Diagnóstico de entorno
(async () => {
  try {
    console.log('==== Diagnóstico de entorno OMR ====');
    const cwd = process.cwd();
    console.log(`Directorio de trabajo: ${cwd}`);
    
    // Verificar directorios importantes
    const scriptDir = path.join(cwd, 'scripts', 'omr');
    const scriptPath = path.join(scriptDir, 'omr_standalone.py');
    const venvPath = path.join(scriptDir, 'venv');
    const pythonPath = path.join(venvPath, 'bin', 'python');
    const publicUploadsDir = path.join(cwd, 'public', 'uploads', 'omr');
    
    try {
      const scriptDirStats = await fs.stat(scriptDir);
      console.log(`scripts/omr existe: ${scriptDirStats.isDirectory()}`);
    } catch (err) {
      console.error(`ERROR: No se encontró el directorio scripts/omr`);
    }
    
    try {
      const scriptStats = await fs.stat(scriptPath);
      console.log(`Script OMR existe: ${scriptStats.isFile()}`);
    } catch (err) {
      console.error(`ERROR: No se encontró el script OMR en ${scriptPath}`);
    }
    
    try {
      const venvStats = await fs.stat(venvPath);
      console.log(`Entorno virtual existe: ${venvStats.isDirectory()}`);
    } catch (err) {
      console.error(`ERROR: No se encontró el entorno virtual en ${venvPath}`);
    }
    
    try {
      const pythonStats = await fs.stat(pythonPath);
      console.log(`Python en venv existe: ${pythonStats.isFile()}`);
    } catch (err) {
      console.error(`ERROR: No se encontró Python en ${pythonPath}`);
    }
    
    // Verificar directorio público para imágenes
    try {
      // Crear directorio si no existe
      await fs.mkdir(publicUploadsDir, { recursive: true });
      const stats = await fs.stat(publicUploadsDir);
      console.log(`Directorio público para imágenes: ${publicUploadsDir} (${stats.isDirectory() ? 'OK' : 'ERROR'})`);
      
      // Probar escritura en directorio público
      const testFile = path.join(publicUploadsDir, 'test.txt');
      await fs.writeFile(testFile, 'test');
      console.log(`Prueba de escritura en directorio público: ${testFile}`);
      
      // Verificar tamaño del archivo de prueba
      const testStats = await fs.stat(testFile);
      console.log(`Archivo de prueba tamaño: ${testStats.size} bytes`);
      
      // Eliminar archivo de prueba
      await fs.unlink(testFile);
      console.log('Prueba de eliminación en directorio público: OK');
    } catch (err) {
      console.error(`ERROR en directorio público: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    console.log('====================================');
  } catch (err) {
    console.error('Error en diagnóstico de entorno:', err);
  }
})();

export const config = {
  api: {
    bodyParser: false,
  },
};

// Optimizar parseo de FormData
async function parseFormData(req: Request): Promise<{file?: File, examId?: string, studentId?: string, groupId?: string }> {
  try {
    // Usar el API de FormData nativo
    const formData = await req.formData();
    
    // Extraer archivo y campos
    const file = formData.get('file') as File | null;
    const examId = formData.get('examId') as string || undefined;
    const studentId = formData.get('studentId') as string || undefined;
    const groupId = formData.get('groupId') as string || undefined;
    
    return { 
      file: file || undefined, 
      examId, 
      studentId, 
      groupId 
    };
  } catch (err) {
    console.error('Error al parsear FormData:', err);
    throw new Error('No se pudo procesar el formulario');
  }
}

// Añadir interfaces para mejor tipado de datos
interface QRData {
  examId: string;
  studentId: string;
  groupId?: string;
  checksum?: string;
  raw?: string;
  isManual?: boolean;
}

interface QRValidation {
  isValid: boolean;
  matchesExam: boolean;
  matchesStudent: boolean;
  message?: string;
}

interface OMRProcessResult {
  success: boolean;
  qr_data?: QRData | string;
  qr_validation?: QRValidation;
  marks?: any;
  error?: string;
  error_details?: {
    type: string;
    code: string;
    message: string;
    recommendations?: string[];
    debug_info?: any;
  };
  raw_output?: string;
  raw_error?: string;
  _debug?: {
    image_path: string;
    command_used: string;
  };
}

interface FinalProcessResult extends OMRProcessResult {
  jobId: string;
  imagePath: string;
  publicUrl: string;
  message: string;
  debug_info: {
    timestamp: string;
    image_size: number | string;
    full_path: string;
    public_url: string;
  };
}

// Función para validar los datos del QR
async function validateQRData(qrData: any, examId?: string, studentId?: string): Promise<{
  isValid: boolean;
  matchesExam: boolean;
  matchesStudent: boolean;
  qrInfo: any;
  validationMessage?: string;
}> {
  // Inicializar resultado
  const result = {
    isValid: false,
    matchesExam: false,
    matchesStudent: false,
    qrInfo: qrData
  };
  
  // Verificar si qrData es un string (formato antiguo) o un objeto estructurado
  if (typeof qrData === 'string') {
    // Formato antiguo: "examId:studentId:groupId:checksum"
    try {
      const parts = qrData.split(':');
      
      if (parts.length < 3) {
        return {
          ...result,
          validationMessage: 'Formato de QR inválido: no contiene suficientes partes'
        };
      }
      
      const qrExamId = parts[0];
      const qrStudentId = parts[1];
      const qrGroupId = parts[2];
      const qrChecksum = parts.length > 3 ? parts[3] : undefined;
      
      // Estructurar la información
      result.qrInfo = {
        examId: qrExamId,
        studentId: qrStudentId,
        groupId: qrGroupId,
        checksum: qrChecksum,
        raw: qrData
      };
      
      // Validar que coincide con el examen solicitado
      if (examId && qrExamId) {
        result.matchesExam = qrExamId === examId;
      }
      
      // Validar que coincide con el estudiante (si se proporcionó)
      if (studentId && qrStudentId) {
        result.matchesStudent = qrStudentId === studentId;
      }
      
      // Verificar checksum si existe
      if (qrChecksum) {
        // Aquí podríamos implementar una verificación de integridad
        // Por ahora, consideramos válido si tiene checksum
        result.isValid = true;
      } else {
        // Sin checksum, aún puede ser válido si tiene los campos mínimos
        result.isValid = Boolean(qrExamId && qrStudentId);
      }
      
      return result;
    } catch (error) {
      return {
        ...result,
        validationMessage: `Error procesando QR: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  } else if (qrData && typeof qrData === 'object') {
    // Es un objeto estructurado (nuevo formato)
    try {
      // Verificar campos obligatorios
      if (!qrData.examId) {
        return {
          ...result,
          validationMessage: 'QR inválido: falta ID de examen'
        };
      }
      
      // Validar que coincide con el examen solicitado
      if (examId && qrData.examId) {
        result.matchesExam = qrData.examId === examId;
      }
      
      // Validar que coincide con el estudiante (si se proporcionó)
      if (studentId && qrData.studentId) {
        result.matchesStudent = qrData.studentId === studentId;
      }
      
      // Verificar checksum si existe
      if (qrData.checksum) {
        // Aquí podríamos implementar verificación de checksum
        result.isValid = true;
      } else if (qrData.isManual) {
        // Datos introducidos manualmente, consideramos válido si tiene los campos mínimos
        result.isValid = Boolean(qrData.examId);
      } else if (qrData.raw) {
        // Tiene datos raw, consideramos válido si tiene los campos mínimos
        result.isValid = Boolean(qrData.examId && qrData.studentId);
      } else {
        // Caso general, validamos si tiene examId y studentId
        result.isValid = Boolean(qrData.examId && qrData.studentId);
      }
      
      return result;
    } catch (error) {
      return {
        ...result,
        validationMessage: `Error procesando objeto QR: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  // No se pudo procesar el formato
  return {
    ...result,
    validationMessage: 'Formato de QR no reconocido'
  };
}

// Función para procesar la imagen con el script Python
async function processWithOMRStandalone(imagePath: string, examId?: string, studentId?: string): Promise<OMRProcessResult> {
  try {
    // Verificar que el archivo de imagen existe
    try {
      const imageStats = await fs.stat(imagePath);
      console.log(`Verificación de imagen: ${imagePath}, Tamaño: ${imageStats.size} bytes`);
      
      if (imageStats.size === 0) {
        throw new Error('El archivo de imagen está vacío');
      }
      
      // Imprimir los primeros bytes para verificar que es una imagen válida
      const headerBytes = await fs.readFile(imagePath, { encoding: null, flag: 'r' }).then(
        buffer => buffer.slice(0, 16).toString('hex')
      );
      console.log(`Verificación de formato: Primeros bytes de la imagen: ${headerBytes}`);
      
      // Verificar formato de imagen
      const isPNG = headerBytes.startsWith('89504e47');
      const isJPEG = headerBytes.startsWith('ffd8ff');
      console.log(`Formato detectado: ${isPNG ? 'PNG' : isJPEG ? 'JPEG' : 'Desconocido'}`);
    } catch (err) {
      console.error('Error accediendo al archivo de imagen:', err);
      return {
        success: false,
        error: `No se pudo acceder al archivo de imagen: ${err instanceof Error ? err.message : 'Error desconocido'}`,
        error_details: {
          type: 'file_access_error',
          code: 'IMAGE_NOT_FOUND',
          message: 'No se pudo acceder al archivo de imagen temporal',
          recommendations: [
            'Verifica que el sistema tenga permisos de escritura en el directorio temporal',
            'Asegúrate de que haya suficiente espacio en disco',
            'Intenta con una imagen de menor tamaño'
          ]
        }
      };
    }
    
    const scriptPath = path.join(process.cwd(), 'scripts', 'omr', 'omr_standalone.py');
    console.log(`Ruta del script OMR: ${scriptPath}`);
    
    // Verificar si el script existe
    try {
      const scriptStats = await fs.stat(scriptPath);
      console.log(`Script OMR existe: ${scriptStats.isFile()}, Tamaño: ${scriptStats.size} bytes`);
    } catch (error) {
      console.error(`El script OMR no existe en la ruta: ${scriptPath}`);
      throw new Error('Script OMR no encontrado');
    }
    
    // Verificar si existe el entorno virtual
    const pythonInterpreter = path.join(process.cwd(), 'scripts', 'omr', 'venv', 'bin', 'python');
    try {
      const pythonStats = await fs.stat(pythonInterpreter);
      console.log(`Python interpreter existe: ${pythonStats.isFile()}, Tamaño: ${pythonStats.size} bytes`);
    } catch (error) {
      console.error(`El intérprete de Python no existe en la ruta: ${pythonInterpreter}`);
      throw new Error('Entorno virtual Python no encontrado en scripts/omr/venv. Verifique la configuración del entorno virtual.');
    }
    
    // Intentar ejecutar Python para ver su versión
    try {
      const { stdout: pythonVersion, stderr: pythonVersionErr } = await execPromise(`"${pythonInterpreter}" --version`);
      console.log(`Versión de Python: ${pythonVersion.trim() || 'desconocida'}`);
      if (pythonVersionErr) {
        console.warn(`Error al verificar versión Python: ${pythonVersionErr}`);
      }
    } catch (err) {
      console.error('Error verificando versión de Python:', err);
    }
    
    // Construir el comando - el script espera la ruta de la imagen como único argumento posicional
    const command = `"${pythonInterpreter}" "${scriptPath}" "${imagePath}"`;
    
    console.log(`Ejecutando comando: ${command}`);
    
    // Ejecutar el script con un timeout de 30 segundos
    try {
      const { stdout, stderr } = await execPromise(command, { timeout: 30000 });
      
      console.log('Script ejecutado. Salida stdout:', stdout ? stdout.slice(0, 500) + '...' : 'Vacío');
      
      if (stderr && stderr.trim() !== '') {
        console.error(`Error en script OMR (stderr completo): ${stderr}`);
        
        // Posibles errores específicos para proporcionar mejor feedback
        if (stderr.includes('ImportError: numpy.core.multiarray failed to import')) {
          throw new Error('Error de compatibilidad con NumPy. Verifique las dependencias del entorno virtual.');
        }
        if (stderr.includes('No QR code found') || stderr.includes('QR code data is empty')) {
          return {
            success: false,
            error: 'No se detectó un código QR en la imagen',
            error_details: {
              type: 'qr_detection_failure',
              code: 'QR_NOT_FOUND',
              message: 'No se pudo detectar un código QR válido en la imagen escaneada',
              recommendations: [
                'Asegúrate de que la imagen incluya un código QR visible',
                'Mejora la iluminación al capturar la imagen',
                'El código QR debe estar completo y sin daños'
              ]
            }
          };
        }
        if (stderr.includes('Could not load image')) {
          return {
            success: false,
            error: stderr.trim(), // Usar el mensaje de error exacto
            error_details: {
              type: 'image_processing_failure',
              code: 'IMAGE_LOAD_ERROR',
              message: 'El formato de imagen no es compatible o la imagen está dañada',
              recommendations: [
                'Intenta con una imagen en formato PNG o JPEG',
                'Verifica que la imagen no esté corrupta',
                'Intenta capturar una nueva imagen con mejor resolución'
              ]
            }
          };
        }
        if (stderr.includes('Could not extract paper from background')) {
          return {
            success: false,
            error: 'No se pudo detectar la hoja de examen',
            error_details: {
              type: 'form_detection_failure',
              code: 'FORM_NOT_FOUND',
              message: 'No se pudo identificar claramente la hoja de examen en la imagen',
              recommendations: [
                'Asegúrate de que la hoja de examen ocupe la mayor parte de la imagen',
                'Mejora el contraste entre la hoja y el fondo',
                'Evita sombras o reflejos en la imagen'
              ]
            }
          };
        }
      }
      
      // Parsear la salida JSON
      try {
        // Si hay stdout, intentamos parsearlo
        if (stdout && stdout.trim() !== '') {
          const omrResult: OMRProcessResult = JSON.parse(stdout);
          
          // Añadimos información adicional para debugging
          omrResult._debug = {
            image_path: imagePath,
            command_used: command
          };
          
          // Procesamos los datos del QR si el script tuvo éxito
          if (omrResult.success && omrResult.qr_data) {
            // El formato del QR es "examId:studentId:groupId:checksum"
            if (typeof omrResult.qr_data === 'string') {
              const qrParts = omrResult.qr_data.split(':');
              
              if (qrParts.length >= 3) {
                // Extraer información del QR
                const qrExamId = qrParts[0];
                const qrStudentId = qrParts[1];
                const qrGroupId = qrParts[2];
                const qrChecksum = qrParts.length > 3 ? qrParts[3] : undefined;
                
                // Reemplazar la cadena original con un objeto estructurado
                omrResult.qr_data = {
                  examId: qrExamId,
                  studentId: qrStudentId,
                  groupId: qrGroupId,
                  checksum: qrChecksum,
                  raw: omrResult.qr_data as string
                };
                
                // Validar los datos del QR
                const qrValidation = await validateQRData(omrResult.qr_data, examId, studentId);
                
                // Añadir información de validación al resultado
                omrResult.qr_validation = {
                  isValid: qrValidation.isValid,
                  matchesExam: qrValidation.matchesExam,
                  matchesStudent: qrValidation.matchesStudent,
                  message: qrValidation.validationMessage
                };
                
                // Usamos los valores del QR en lugar de los proporcionados por parámetros
                if (qrExamId) {
                  examId = qrExamId;
                }
              } else {
                // Si el formato no es el esperado, mantener la información que tenemos
                console.warn('Formato QR inesperado:', omrResult.qr_data);
                omrResult.qr_data = {
                  raw: omrResult.qr_data as string,
                  examId: examId || '',
                  studentId: studentId || ''
                };
                
                // Añadir información de validación al resultado
                omrResult.qr_validation = {
                  isValid: false,
                  matchesExam: false,
                  matchesStudent: false,
                  message: 'Formato de QR inválido: no contiene suficientes partes'
                };
              }
            } else if (typeof omrResult.qr_data === 'object') {
              // Ya es un objeto, validamos directamente
              const qrValidation = await validateQRData(omrResult.qr_data, examId, studentId);
              
              // Añadir información de validación al resultado
              omrResult.qr_validation = {
                isValid: qrValidation.isValid,
                matchesExam: qrValidation.matchesExam,
                matchesStudent: qrValidation.matchesStudent,
                message: qrValidation.validationMessage
              };
            }
          } else if (examId) {
            // Si no hay datos QR pero tenemos ID de examen como parámetro
            omrResult.qr_data = {
              examId: examId,
              studentId: studentId || "unknown",
              isManual: true
            };
            
            // Añadir información de validación para datos manuales
            omrResult.qr_validation = {
              isValid: true, // Consideramos válido porque es manual
              matchesExam: true, // Por definición coincide con el examen solicitado
              matchesStudent: true, // Por definición coincide con el estudiante solicitado
              message: 'Datos proporcionados manualmente, no hay QR para validar'
            };
          }
          
          return omrResult;
        } else {
          // Si no hay output, probablemente el script falló pero sin un error específico
          throw new Error('El script OMR no produjo ninguna salida');
        }
      } catch (error) {
        console.error('Error parseando salida del script OMR:', error);
        console.error('Salida del script (stdout completo):', stdout);
        
        // Proporcionar un error estructurado
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Error en el formato de salida del procesador OMR',
          error_details: {
            type: 'omr_processing_failure',
            code: 'INVALID_OUTPUT',
            message: 'El procesador OMR no pudo interpretar correctamente la imagen',
            recommendations: [
              'Intenta con una imagen más clara y bien iluminada',
              'Asegúrate de que la hoja de examen esté completa en la imagen',
              'Verifica que las marcas sean claras y estén dentro de los círculos'
            ]
          },
          raw_output: stdout,
          raw_error: stderr
        };
      }
    } catch (execError) {
      // Error de timeout o error en la ejecución del comando
      console.error('Error ejecutando el script Python (error completo):', execError);
      
      if (execError instanceof Error && execError.message.includes('timeout')) {
        return {
          success: false,
          error: 'Tiempo de espera agotado al ejecutar el script',
          error_details: {
            type: 'execution_error',
            code: 'TIMEOUT',
            message: 'El script tardó demasiado en procesar la imagen',
            recommendations: [
              'Intenta con una imagen de menor tamaño o resolución',
              'Verifica que el sistema tenga suficientes recursos',
              'Reinicia el servidor si el problema persiste'
            ]
          }
        };
      }
      
      return {
        success: false,
        error: execError instanceof Error ? execError.message : 'Error al ejecutar el script',
        error_details: {
          type: 'execution_error',
          code: 'SCRIPT_FAILED',
          message: 'No se pudo ejecutar el script de procesamiento',
          debug_info: {
            command: command,
            error: execError instanceof Error ? execError.message : String(execError)
          },
          recommendations: [
            'Verifica que el script tenga permisos de ejecución',
            'Asegúrate de que el entorno virtual esté correctamente configurado',
            'Comprueba los logs del servidor para más detalles'
          ]
        }
      };
    }
  } catch (error) {
    console.error('Error procesando con OMR standalone (error completo):', error);
    
    // Si es un error ya estructurado, lo devolvemos tal cual
    if (error instanceof Error && error.message.includes('Error de compatibilidad con NumPy')) {
      return {
        success: false,
        error: error.message,
        error_details: {
          type: 'environment_error',
          code: 'NUMPY_COMPATIBILITY',
          message: 'Problema de compatibilidad con las dependencias Python',
          recommendations: [
            'Verifique que las versiones de NumPy y OpenCV sean compatibles',
            'Intente reconstruir el entorno virtual con las dependencias correctas'
          ]
        }
      };
    }
    
    // Otros errores genéricos
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido procesando la imagen',
      error_details: {
        type: 'script_execution_error',
        code: 'EXECUTION_FAILED',
        message: 'No se pudo ejecutar correctamente el procesador OMR',
        recommendations: [
          'Verifica los permisos de ejecución del script',
          'Asegúrate de que el entorno virtual Python esté configurado correctamente',
          'Revisa los logs del servidor para más detalles'
        ]
      }
    };
  }
}

export async function POST(req: Request) {
  let tempFilePath: string | null = null;
  
  try {
    // Determinar tipo de contenido
    const contentType = req.headers.get('content-type') || '';
    let imageData: string | null = null;
    let file: File | undefined;
    let examId: string | undefined;
    let studentId: string | undefined;
    let groupId: string | undefined;
    
    // Procesar según el tipo de contenido
    if (contentType.includes('multipart/form-data')) {
      // Procesar como FormData
      console.log('Recibiendo datos como FormData');
      const formData = await parseFormData(req);
      file = formData.file;
      examId = formData.examId;
      studentId = formData.studentId;
      groupId = formData.groupId;
      
      if (!file) {
        return NextResponse.json(
          { error: 'No se proporcionó ninguna imagen en el FormData', success: false },
          { status: 400 }
        );
      }
      
      // Log del tipo de archivo recibido
      console.log(`Tipo de archivo: ${file.type}, Tamaño: ${file.size} bytes, Nombre: ${file.name}`);
      
    } else if (contentType.includes('application/json')) {
      // Procesar como JSON
      console.log('Recibiendo datos como JSON');
      const jsonData = await req.json() as { 
        imageData?: string;
        examId?: string;
        studentId?: string;
        groupId?: string;
      };
      
      imageData = jsonData.imageData || null;
      examId = jsonData.examId;
      studentId = jsonData.studentId;
      groupId = jsonData.groupId;
      
      if (!imageData) {
        return NextResponse.json(
          { error: 'No se proporcionó ninguna imagen en el JSON', success: false },
          { status: 400 }
        );
      }
      
      // Verificar que los datos base64 tienen un formato válido
      if (!imageData.startsWith('data:image') && !imageData.includes('base64')) {
        console.log('Los datos de imagen no tienen un formato base64 válido');
      }
      
    } else {
      return NextResponse.json(
        { error: `Tipo de contenido no soportado: ${contentType}`, success: false },
        { status: 400 }
      );
    }

    // Generar un ID único para el trabajo
    const jobId = uuidv4();
    
    // Crear un directorio para guardar la imagen en public/uploads para que sea accesible desde el frontend
    const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads', 'omr');
    try {
      await fs.mkdir(publicUploadsDir, { recursive: true });
      console.log(`Directorio público para imágenes creado: ${publicUploadsDir}`);
    } catch (err) {
      console.error(`Error creando directorio público: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    // Guardar la imagen en el directorio público
    const filename = `scan_${jobId}.jpg`;
    tempFilePath = path.join(publicUploadsDir, filename);
    const publicPath = `/uploads/omr/${filename}`;
    
    try {
      if (file) {
        // Si tenemos un archivo del FormData
        console.log(`Guardando imagen desde FormData en: ${tempFilePath}`);
        
        // Obtener el arrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Convertir a string para inspeccionar
        const bufferStart = buffer.toString('utf8', 0, 100);
        console.log(`Inicio del buffer: ${bufferStart.substring(0, 50)}...`);
        
        // Verificar si los datos comienzan con "data:image/"
        if (bufferStart.startsWith('data:image/')) {
          console.log('Detectada imagen en formato base64 dentro de FormData, extrayendo...');
          
          // Extraer la parte de datos base64 después de la coma
          const base64Data = bufferStart.includes('base64,') 
            ? buffer.toString().split('base64,')[1] 
            : buffer.toString();
          
          if (base64Data) {
            console.log(`Longitud de datos base64: ${base64Data.length} caracteres`);
            const imageBuffer = Buffer.from(base64Data, 'base64');
            await fs.writeFile(tempFilePath, imageBuffer);
            console.log(`Imagen guardada desde datos base64, tamaño: ${imageBuffer.length} bytes`);
          } else {
            throw new Error('No se pudo extraer los datos base64 de la imagen');
          }
        } else {
          // Es un archivo normal, escribirlo directamente
          await fs.writeFile(tempFilePath, buffer);
          console.log(`Imagen guardada directamente, tamaño: ${buffer.length} bytes`);
        }
      } else if (imageData) {
        // Si tenemos datos base64 del JSON
        console.log(`Guardando imagen desde JSON en: ${tempFilePath}`);
        console.log(`Inicio de los datos de imagen: ${imageData.substring(0, 50)}...`);
        
        // Extraer la parte de datos de la cadena base64 si es necesario
        const base64Data = imageData.includes('base64,') 
          ? imageData.split('base64,')[1] 
          : imageData;
        
        console.log(`Longitud de datos base64 extraídos: ${base64Data.length} caracteres`);
        const buffer = Buffer.from(base64Data, 'base64');
        await fs.writeFile(tempFilePath, buffer);
        console.log(`Imagen guardada desde JSON base64, tamaño: ${buffer.length} bytes`);
      } else {
        return NextResponse.json(
          { error: 'No se pudo procesar la imagen: formato no válido', success: false },
          { status: 400 }
        );
      }
      
      // Verificar que el archivo se creó correctamente
      const fileStats = await fs.stat(tempFilePath);
      console.log(`Archivo creado en directorio público: ${tempFilePath}, Tamaño: ${fileStats.size} bytes`);
      
      if (fileStats.size === 0) {
        throw new Error('El archivo creado está vacío');
      }
    } catch (err) {
      console.error(`Error al guardar la imagen en ${tempFilePath}:`, err);
      return NextResponse.json(
        { 
          error: 'Error al guardar la imagen',
          details: err instanceof Error ? err.message : 'Error desconocido',
          success: false
        },
        { status: 500 }
      );
    }
    
    // Procesar la imagen con el script de Python
    const omrResult = await processWithOMRStandalone(tempFilePath, examId, studentId);
    console.log('Resultado del procesamiento OMR:', JSON.stringify(omrResult).slice(0, 200) + '...');
    
    // Añadir información del trabajo al resultado
    const finalResult: FinalProcessResult = {
      ...omrResult,
      jobId,
      imagePath: tempFilePath,
      publicUrl: publicPath, // URL pública para acceso desde el frontend
      message: omrResult.success ? 
        'Imagen procesada correctamente con OMR' : 
        'Error al procesar la imagen',
      debug_info: {
        timestamp: new Date().toISOString(),
        image_size: await fs.stat(tempFilePath).then(stats => stats.size).catch(() => 'unknown'),
        full_path: path.resolve(tempFilePath),
        public_url: publicPath
      }
    };
    
    // NO eliminamos el archivo para que pueda ser mostrado en el frontend
    console.log(`Imagen conservada para visualización en la UI: ${publicPath}`);
    
    // Devolver resultado
    return NextResponse.json(finalResult);
  } catch (error) {
    console.error('Error processing scan:', error);
    
    // Devolver error
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error al procesar la imagen',
        success: false,
        jobId: tempFilePath ? path.basename(tempFilePath).replace('scan_', '').replace('.jpg', '') : undefined,
        tempFilePath // Incluir la ruta del archivo para debugging
      },
      { status: 500 }
    );
  }
}