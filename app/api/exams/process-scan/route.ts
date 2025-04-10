import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import logger from '@/lib/utils/logger';

// Configure debug flag
const DEBUG = process.env.NODE_ENV === 'development';

// Promisify exec for cleaner async/await usage
const execPromise = promisify(exec);

// Define interfaces for better type handling
interface OMRResult {
  answers: Array<{
    question_number: number;
    answer_value: string;
    confidence?: number;
    number?: number;
    value?: string;
  }>;
  processed_image_path?: string;
  processedImagePath?: string;
  original_image_path?: string;
  originalImagePath?: string;
  qr_data?: string | Record<string, unknown>;
  qrData?: string | Record<string, unknown>;
  student_info?: Record<string, unknown>;
  [key: string]: unknown;
}

// Function to run the Python OMR script
async function runOMRScript(imagePath: string, _unused: string): Promise<OMRResult> {
  try {
    const cwd = process.cwd();
    const scriptDir = path.join(cwd, 'scripts', 'omr');
    const scriptPath = path.join(scriptDir, 'omr_standalone.py');
    const venvPath = path.join(scriptDir, 'venv');
    const pythonPath = path.join(venvPath, 'bin', 'python');
    
    // Validate Python script and venv existence
    await fs.access(scriptPath);
    await fs.access(pythonPath);
    
    // The correct command format based on the provided example
    // The script takes just the image path as argument, no --output flag
    const command = `${pythonPath} ${scriptPath} ${imagePath}`;
    
    if (DEBUG) {
      logger.log('Executing OMR command:', command);
    }
    
    // Execute the Python script and capture its output
    const { stdout, stderr } = await execPromise(command);
    
    if (DEBUG) {
      if (stderr && stderr.trim()) logger.error('OMR stderr:', stderr);
      logger.log('OMR stdout length:', stdout ? stdout.length : 0);
      
      // Log a sample of the output to help debug
      if (stdout && stdout.length > 0) {
        logger.log('OMR stdout sample:', stdout.substring(0, 200) + (stdout.length > 200 ? '...' : ''));
      }
    }
    
    // The script outputs the result to stdout as JSON
    if (!stdout || stdout.trim() === '') {
      throw new Error('No output from OMR script');
    }
    
    try {
      // Try to parse the stdout as JSON
      const result = JSON.parse(stdout) as OMRResult;
      
      // Debug: Log the structure of the result to help identify where the processed image path is stored
      if (DEBUG) {
        logger.log('OMR result keys:', Object.keys(result));
        if (result.processed_image_path) {
          logger.log('Found processed_image_path:', result.processed_image_path);
        } else if (result.processedImagePath) {
          logger.log('Found processedImagePath:', result.processedImagePath);
        } else {
          // Look for image paths in nested objects
          for (const key in result) {
            if (typeof result[key] === 'object' && result[key] !== null) {
              const nestedKeys = Object.keys(result[key] as object);
              logger.log(`Nested keys in ${key}:`, nestedKeys);
              
              const nestedObj = result[key] as Record<string, unknown>;
              if (nestedObj.processed_image_path || nestedObj.processedImagePath) {
                logger.log(`Found image path in ${key}:`, 
                  nestedObj.processed_image_path || nestedObj.processedImagePath);
              }
            }
          }
        }
      }
      
      return result;
    } catch (parseError) {
      logger.error('Error parsing OMR output JSON:', parseError);
      logger.error('Raw output:', stdout.substring(0, 200) + '...');
      throw new Error('Invalid JSON output from OMR script');
    }
  } catch (error) {
    logger.error('Error executing OMR script:', error);
    throw error;
  }
}

// Ensure uploads directory exists
async function ensureUploadsDirectory() {
  const cwd = process.cwd();
  const publicUploadsDir = path.join(cwd, 'public', 'uploads', 'omr');
  
  try {
    await fs.mkdir(publicUploadsDir, { recursive: true });
    return publicUploadsDir;
  } catch (error) {
    logger.error('Error creating uploads directory:', error);
    throw error;
  }
}

// Environment diagnostic function
async function runEnvironmentDiagnostic() {
  if (!DEBUG) return;
  
  try {
    logger.log('==== Diagnóstico de entorno OMR ====');
    const cwd = process.cwd();
    logger.log(`Directorio de trabajo: ${cwd}`);
    
    // Verify important directories
    const scriptDir = path.join(cwd, 'scripts', 'omr');
    const scriptPath = path.join(scriptDir, 'omr_standalone.py');
    const venvPath = path.join(scriptDir, 'venv');
    const pythonPath = path.join(venvPath, 'bin', 'python');
    const publicUploadsDir = path.join(cwd, 'public', 'uploads', 'omr');
    
    try {
      const scriptDirStats = await fs.stat(scriptDir);
      logger.log(`scripts/omr existe: ${scriptDirStats.isDirectory()}`);
    } catch {
      logger.error(`ERROR: No se encontró el directorio scripts/omr`);
    }
    
    try {
      const scriptStats = await fs.stat(scriptPath);
      logger.log(`Script OMR existe: ${scriptStats.isFile()}`);
    } catch {
      logger.error(`ERROR: No se encontró el script OMR en ${scriptPath}`);
    }
    
    try {
      const venvStats = await fs.stat(venvPath);
      logger.log(`Entorno virtual existe: ${venvStats.isDirectory()}`);
    } catch {
      logger.error(`ERROR: No se encontró el entorno virtual en ${venvPath}`);
    }
    
    try {
      const pythonStats = await fs.stat(pythonPath);
      logger.log(`Python en venv existe: ${pythonStats.isFile()}`);
    } catch {
      logger.error(`ERROR: No se encontró Python en ${pythonPath}`);
    }
    
    // Verify public directory for images
    try {
      await fs.mkdir(publicUploadsDir, { recursive: true });
      const stats = await fs.stat(publicUploadsDir);
      logger.log(`Directorio público para imágenes: ${publicUploadsDir} (${stats.isDirectory() ? 'OK' : 'ERROR'})`);
      
      // Test write in public directory
      const testFile = path.join(publicUploadsDir, 'test.txt');
      await fs.writeFile(testFile, 'test');
      logger.log(`Prueba de escritura en directorio público: ${testFile}`);
      
      // Verify test file size
      const testStats = await fs.stat(testFile);
      logger.log(`Archivo de prueba tamaño: ${testStats.size} bytes`);
      
      // Remove test file
      await fs.unlink(testFile);
      logger.log('Prueba de eliminación en directorio público: OK');
    } catch (error) {
      logger.error(`ERROR en directorio público: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    logger.log('====================================');
  } catch (error) {
    logger.error('Error en diagnóstico de entorno:', error);
  }
}

// Run diagnostic on startup
runEnvironmentDiagnostic();

// Function to parse and normalize QR data
function normalizeQRData(qrData: string | Record<string, unknown>): Record<string, unknown> {
  // If QR data is already properly structured, return it
  if (qrData && typeof qrData === 'object' && ('examId' in qrData || 'examenId' in qrData)) {
    return qrData;
  }
  
  // If QR data is a string, try to parse it
  if (typeof qrData === 'string') {
    try {
      // Try to parse as JSON first
      const parsedData = JSON.parse(qrData);
      return normalizeQRData(parsedData); // Recursively normalize the parsed data
    } catch (e) {
      // Not JSON, try to extract IDs from the string
      
      // Check if it might be colon-separated UUIDs (common QR format)
      // Pattern like: "40ffbbbe-577f-46b4-80e1-051ba9fa1594:51b1b60d-597d-47f0-968b-4bb92a4790f1:54efc0d1-5aec-46ed-b80d-d784fdc5ea0e:2981c20c"
      if (qrData.includes(':') && qrData.includes('-')) {
        const parts = qrData.split(':');
        if (parts.length >= 3) {
          // Assume format is examId:studentId:groupId[:version]
          return {
            examId: parts[0],
            studentId: parts[1],
            groupId: parts[2],
            version: parts[3] || '1'
          };
        }
      }
      
      // Check if it might be a URL with query parameters
      try {
        const url = new URL(qrData.startsWith('http') ? qrData : `http://example.com/${qrData}`);
        const params = Object.fromEntries(url.searchParams);
        if (Object.keys(params).length > 0) {
          return {
            examId: params.examId || params.examenId || params.exam_id || params.examen_id || null,
            studentId: params.studentId || params.estudianteId || params.student_id || params.estudiante_id || null,
            groupId: params.groupId || params.grupoId || params.group_id || params.grupo_id || null,
            version: params.version || '1'
          };
        }
      } catch {
        // Not a valid URL, continue to other parsing methods
      }
      
      // If it's not a URL, it might be a custom format or plain text
      // Example: "ExamID:123,StudentID:456,GroupID:789"
      const keyValueRegex = /(\w+):([^,]+)/g;
      let match;
      const extractedData: Record<string, string> = {};
      
      // Use a loop instead of matchAll for better compatibility
      while ((match = keyValueRegex.exec(qrData)) !== null) {
        const key = match[1];
        const value = match[2];
        extractedData[key.toLowerCase()] = value;
      }
      
      if (Object.keys(extractedData).length > 0) {
        return {
          examId: extractedData.examid || extractedData.examenid || extractedData.exam_id || extractedData.examen_id || null,
          studentId: extractedData.studentid || extractedData.estudianteid || extractedData.student_id || extractedData.estudiante_id || null,
          groupId: extractedData.groupid || extractedData.grupoid || extractedData.group_id || extractedData.grupo_id || null,
          version: extractedData.version || '1'
        };
      }
    }
  }
  
  // If we got here but couldn't parse the data, return a placeholder with explicit nulls
  return {
    examId: null,
    studentId: null,
    groupId: null,
    version: '1'
  };
}

export async function POST(request: NextRequest) {
  // Keep track of in-progress requests to prevent duplicates
  const requestId = Date.now().toString();
  if (DEBUG) {
    logger.log(`[${requestId}] Starting process-scan request`);
  }
  
  try {
    // Check for required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        success: false, 
        error: "Configuración de servidor incompleta" 
      }, { status: 500 });
    }
    
    // Get form data from request
    const formData = await request.formData();
    const scan = formData.get('scan') as File;
    const examId = formData.get('examId') as string;
    const studentId = formData.get('studentId') as string;
    const jobId = formData.get('job_id') as string || `job-${Date.now()}`;
    
    // Validate required fields
    if (!scan) {
      return NextResponse.json({ 
        success: false, 
        error: "No se proporcionó archivo de escaneo" 
      }, { status: 400 });
    }
    
    // Create unique file name
    const timestamp = Date.now();
    const originalFilename = scan.name;
    const extension = originalFilename.split('.').pop() || 'jpg';
    const filename = `scan_${timestamp}.${extension}`;
    
    // Ensure uploads directory exists
    const uploadsDir = await ensureUploadsDirectory();
    const filePath = path.join(uploadsDir, filename);
    
    // Save file to disk
    const fileBuffer = Buffer.from(await scan.arrayBuffer());
    await fs.writeFile(filePath, fileBuffer);
    
    if (DEBUG) {
      logger.log('File saved successfully:', filePath);
      logger.log('File size:', fileBuffer.length, 'bytes');
    }
    
    // Get the public URL for the saved image
    const publicPath = `/uploads/omr/${filename}`;
    const fullPublicUrl = new URL(publicPath, request.nextUrl.origin).toString();
    
    try {
      // Process the image using the Python OMR script
      const omrResult = await runOMRScript(filePath, jobId);
      
      // If we got here, the script executed successfully
      if (DEBUG) {
        logger.log('OMR processing successful:', typeof omrResult === 'object' ? 'Object returned' : omrResult);
      }
      
      // Validate the result structure
      if (!omrResult || typeof omrResult !== 'object') {
        throw new Error('Invalid output format from OMR script');
      }
      
      // Ensure required properties exist even if not provided by the script
      const normalizedResult = {
        qr_data: omrResult.qr_data || null,
        answers: Array.isArray(omrResult.answers) ? omrResult.answers : [],
        processed_image_path: omrResult.processed_image_path || null,
        student_info: omrResult.student_info || null // Add student_info to the normalized result
      };
      
      // Add QR data from parameters if not detected in the image
      if (!normalizedResult.qr_data && (examId || studentId)) {
        normalizedResult.qr_data = {
          examId: examId || 'placeholder',
          studentId: studentId || 'placeholder',
          groupId: 'placeholder',
          version: '1'
        };
      } else if (normalizedResult.qr_data) {
        // Try to normalize and extract data from the QR
        const parsedQRData = normalizeQRData(normalizedResult.qr_data);
        if (parsedQRData) {
          normalizedResult.qr_data = parsedQRData;
        }
        
        // If we have student info from the image, extract it (visible in the shared example)
        if (normalizedResult.student_info) {
          if (!normalizedResult.qr_data) {
            normalizedResult.qr_data = {};
          }
          
          // Add the student info to the QR data if we have it
          if (normalizedResult.qr_data && typeof normalizedResult.qr_data === 'object') {
            const qrDataObj = normalizedResult.qr_data as Record<string, unknown>;
            qrDataObj.studentInfo = normalizedResult.student_info;
            
            // Try to extract IDs from the student info if it's an object
            const studentInfo = normalizedResult.student_info;
            if (studentInfo && typeof studentInfo === 'object') {
              // Use type assertion to avoid TypeScript errors
              const typedStudentInfo = studentInfo as Record<string, any>;
              
              if (typedStudentInfo.id && !qrDataObj.studentId) {
                qrDataObj.studentId = String(typedStudentInfo.id);
              }
              if (typedStudentInfo.exam_id && !qrDataObj.examId) {
                qrDataObj.examId = String(typedStudentInfo.exam_id);
              }
              if (typedStudentInfo.group_id && !qrDataObj.groupId) {
                qrDataObj.groupId = String(typedStudentInfo.group_id);
              }
            }
          }
        }
      }
      
      // Generate sample answers if none were returned by the OMR script
      if (!normalizedResult.answers || normalizedResult.answers.length === 0) {
        logger.warn('No answers returned by OMR script, using placeholder data');
        // In dev mode, create synthetic answers for testing
        if (DEBUG) {
          normalizedResult.answers = [
            { question_number: 1, answer_value: 'A', confidence: 95 },
            { question_number: 2, answer_value: 'B', confidence: 90 },
            { question_number: 3, answer_value: 'C', confidence: 85 }
          ];
        }
      }
      
      // After running the script and before trying to find the processed image,
      // add a small delay to allow the file system to update
      if (DEBUG) {
        logger.log(`[${requestId}] OMR script completed, waiting for file system updates...`);
      }
      
      // Wait for a moment to let the file system catch up
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Handle the processed image path - the Python script creates a version with "questions_detected" suffix
      const originalDir = path.dirname(filePath);
      const originalFileName = path.basename(filePath, `.${extension}`);
      const processedFileName = `${originalFileName}questions_detected.${extension}`;
      const processedImagePath = normalizedResult.processed_image_path || 
                                 path.join(originalDir, processedFileName);
      
      // Check if the processed image exists
      let processedImageExists = false;
      let actualProcessedPath = processedImagePath; // Variable to store the actual path if found
      
      // Try multiple times with small delays between attempts
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        // Log the directory contents to help debug
        let dirContents: string[] = [];
        if (DEBUG) {
          try {
            dirContents = await fs.readdir(originalDir);
            logger.log(`[${requestId}] Contents of uploads directory (attempt ${attempt}):`, dirContents);
            
            // Check if any file in the directory looks like a processed version
            const possibleProcessedFiles = dirContents.filter(fileName => 
              fileName.includes('questions_detected') || 
              fileName.includes('processed') || 
              (fileName.includes(path.basename(filePath, `.${extension}`)) && 
               fileName !== path.basename(filePath))
            );
            
            if (possibleProcessedFiles.length > 0) {
              logger.log(`[${requestId}] Possible processed files found:`, possibleProcessedFiles);
            }
          } catch (error) {
            logger.error(`[${requestId}] Error reading uploads directory:`, error);
          }
        }
        
        try {
          await fs.access(processedImagePath);
          processedImageExists = true;
          if (DEBUG) {
            logger.log(`[${requestId}] Processed image found at (attempt ${attempt}):`, processedImagePath);
          }
          break; // Found the file, no need to try other patterns
        } catch {
          // Try alternative naming patterns if the first attempt fails
          const alternativePaths = [
            // Try with different separators between filename and suffix
            path.join(originalDir, `${originalFileName}_questions_detected.${extension}`),
            // Try with direct appending of the suffix
            path.join(originalDir, `${originalFileName}questions_detected.${extension}`),
            // Try with common prefix variations
            path.join(originalDir, `${originalFileName.replace('scan_', '@scan_')}questions_detected.${extension}`),
            path.join(originalDir, `@${originalFileName}questions_detected.${extension}`),
            // Try Python-generated variations
            path.join(originalDir, `processed_${originalFileName}.${extension}`),
            // Try plain filename with questions_detected in different positions
            path.join(originalDir, `questions_detected_${path.basename(filePath)}`),
            // Try just looking for the original filename in the path
            ...dirContents
              .filter((file: string) => 
                file.includes(path.basename(filePath, `.${extension}`)) && 
                file !== path.basename(filePath)
              )
              .map((file: string) => path.join(originalDir, file))
          ];
          
          // Try each alternative path
          for (const altPath of alternativePaths) {
            try {
              await fs.access(altPath);
              processedImageExists = true;
              actualProcessedPath = altPath; // Store the actual path that was found
              if (DEBUG) {
                logger.log(`[${requestId}] Processed image found at alternative path (attempt ${attempt}):`, altPath);
              }
              break;
            } catch {
              // Continue to next path
            }
          }
          
          if (processedImageExists) {
            break; // Found a file with an alternative path, no need to continue
          }
          
          // If this is not the last attempt and we haven't found the file yet, wait before trying again
          if (attempt < maxAttempts && !processedImageExists) {
            if (DEBUG) {
              logger.warn(`[${requestId}] Processed image not found on attempt ${attempt}, waiting before retry...`);
            }
            // Wait a bit longer between attempts
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      // If still not found after all attempts, log warning
      if (!processedImageExists && DEBUG) {
        logger.warn(`[${requestId}] Processed image not found after ${maxAttempts} attempts:`, {
          primary: processedImagePath,
          imageData: normalizedResult.qr_data ? 'QR data present' : 'No QR data',
          answersCount: normalizedResult.answers ? normalizedResult.answers.length : 0
        });
      }
      
      // Get public URLs for the images
      let processedPublicPath = publicPath; // Default to original image path
      if (processedImageExists) {
        // Extract just the filename from the actual processed path
        const processedFileName = path.basename(actualProcessedPath);
        processedPublicPath = `/uploads/omr/${processedFileName}`;
        
        if (DEBUG) {
          logger.log(`[${requestId}] Using processed image public path:`, processedPublicPath);
        }
      }

      const processedPublicUrl = new URL(processedPublicPath, request.nextUrl.origin).toString();
      
      // Return results
      return NextResponse.json({
        success: true,
        processedImageUrl: processedPublicUrl,
        publicUrl: fullPublicUrl,
        qr_data: normalizedResult.qr_data,
        answers: normalizedResult.answers,
        result: {
          processed_image_path: processedPublicUrl,
          original_image_path: fullPublicUrl,
          answers: normalizedResult.answers,
          qr_data: normalizedResult.qr_data
        }
      });
    } catch (omrError) {
      logger.error(`[${requestId}] OMR processing error:`, omrError);
      
      // Check if the error is related to missing script files
      const errorMessage = omrError instanceof Error ? omrError.message : "Error al procesar con OMR";
      const isMissingScriptError = errorMessage.includes('ENOENT') || 
                                  errorMessage.includes('No such file or directory') ||
                                  errorMessage.includes('not found');
      
      // Provide specific recommendations based on the error type
      const recommendations = isMissingScriptError
        ? [
            "El script de Python no se encuentra en la ubicación esperada",
            "Asegúrate de que se ha instalado correctamente el entorno de Python",
            "Verifica la estructura de directorios scripts/omr"
          ]
        : [
            "Verifica que la imagen sea clara y bien iluminada",
            "Asegúrate de que el examen esté completo en la imagen",
            "Comprueba que la imagen no esté distorsionada o borrosa"
          ];
      
      // Return a more specific error for OMR processing failure
      return NextResponse.json({ 
        success: false, 
        error: "Error en el procesamiento OMR",
        error_details: {
          message: errorMessage,
          recommendations,
          request_id: requestId
        }
      }, { status: 500 });
    }
    
  } catch (error) {
    logger.error(`[${requestId}] Error general en procesamiento de escaneo:`, error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Error desconocido",
      error_details: {
        message: error instanceof Error ? error.message : "Error desconocido en procesamiento",
        recommendations: [
          "Intenta con una imagen con mejor iluminación",
          "Asegúrate de que el examen esté completamente visible",
          "Asegúrate de que el código QR sea visible y esté en buen estado"
        ],
        request_id: requestId
      }
    }, { status: 500 });
  }
}