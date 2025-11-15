import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as _os from 'os';
import * as _crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import logger from '@/lib/utils/logger';
import { getApiTranslator } from '@/i18n/api';
import { processOMRImage, OMRServiceError } from '@/lib/services/omr-client';

export const dynamic = "force-dynamic";
export const maxDuration = 10; // Vercel Free tier limit (10s)
// For Pro tier: export const maxDuration = 60;

// Configure debug flag
const DEBUG = process.env.NODE_ENV === 'development' || process.env.ENABLE_OMR_DEBUG === 'true';

// Feature flags for OMR service migration
const USE_NEW_OMR_SERVICE = process.env.OMR_USE_NEW_SERVICE === 'true';
const OMR_CANARY_PERCENTAGE = parseInt(process.env.OMR_CANARY_PERCENTAGE || '0', 10);

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
  processed_image_base64?: string; // Base64 image for Vercel (where files in /tmp are not publicly accessible)
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

  // Vercel sets VERCEL=1 automatically in their environment
  // Use /tmp in Vercel (serverless, read-only filesystem)
  // Use public/uploads in VPS/local (persistent filesystem)
  const isVercel = process.env.VERCEL === '1';

  const uploadsDir = isVercel
    ? path.join('/tmp', 'omr-uploads')
    : path.join(cwd, 'public', 'uploads', 'omr');

  try {
    await fs.mkdir(uploadsDir, { recursive: true });

    if (DEBUG) {
      logger.log(`Using uploads directory: ${uploadsDir} (environment: ${isVercel ? 'Vercel/tmp' : 'VPS/public'})`);
    }

    return uploadsDir;
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

/**
 * Process image using the new OMR HTTP service
 * @param imageFile - Image file to process
 * @returns OMR result
 */
async function processWithNewOMRService(imageFile: File | Blob): Promise<{
  success: boolean;
  qr_data?: string | null;
  answers?: Array<{
    number: number;
    value: string | null;
    confidence?: number;
  }>;
  processed_image?: string | null;
  error?: string;
  error_code?: string;
}> {
  try {
    logger.log('[OMR] Using new HTTP service');

    const result = await processOMRImage(imageFile, {
      debug: DEBUG,
    });

    // Transform result to match expected format
    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Processing failed',
        error_code: result.error_code,
      };
    }

    // Map answers to legacy format (with both snake_case and camelCase)
    const mappedAnswers = result.answers?.map((ans) => ({
      number: ans.number,
      question_number: ans.number, // Legacy field
      value: ans.value,
      answer_value: ans.value || '', // Legacy field
      confidence: ans.confidence,
      num_options: ans.num_options,
    })) || [];

    return {
      success: true,
      qr_data: result.qr_data || null,
      answers: mappedAnswers,
      processed_image: result.processed_image || null,
    };
  } catch (error) {
    logger.error('[OMR] Error with new service:', error);

    if (error instanceof OMRServiceError) {
      return {
        success: false,
        error: error.message,
        error_code: error.errorCode,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      error_code: 'INTERNAL_ERROR',
    };
  }
}

/**
 * Determine whether to use the new OMR service
 * Based on feature flag and canary percentage
 */
function shouldUseNewService(): boolean {
  // If explicitly enabled, use it
  if (USE_NEW_OMR_SERVICE) {
    return true;
  }

  // If canary percentage is set, use probabilistic routing
  if (OMR_CANARY_PERCENTAGE > 0) {
    const random = Math.random() * 100;
    return random < OMR_CANARY_PERCENTAGE;
  }

  return false;
}

// Function to parse and normalize QR data
function normalizeQRData(qrData: string | Record<string, unknown>): Record<string, unknown> {
  // If QR data is already properly structured, return it
  if (qrData && typeof qrData === 'object' && 'examId' in qrData) {
    return qrData;
  }
  
  // If QR data is a string, try to parse it
  if (typeof qrData === 'string') {
    try {
      // Try to parse as JSON first
      const parsedData = JSON.parse(qrData);
      return normalizeQRData(parsedData); // Recursively normalize the parsed data
    } catch (_e) {
      // Not JSON, try to extract IDs from the string
      
      // Check if it might be colon-separated UUIDs (common QR format)
      // Pattern like: "40ffbbbe-577f-46b4-80e1-051ba9fa1594:51b1b60d-597d-47f0-968b-4bb92a4790f1:54efc0d1-5aec-46ed-b80d-d784fdc5ea0e:2981c20c"
      if (qrData.includes(':') && qrData.includes('-')) {
        const parts = qrData.split(':');
        if (parts.length >= 3) {
          // Format is examId:studentId:groupId[:hash]
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
      const { t } = await getApiTranslator(request, 'exams.process-scan');
      return NextResponse.json({ 
        success: false, 
        error: t('errors.serverConfig') 
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
      const { t } = await getApiTranslator(request, 'exams.process-scan');
      return NextResponse.json({ 
        success: false, 
        error: t('errors.missingScan') 
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
    
    // Determine the base URL, preferring NEXT_PUBLIC_SITE_URL in production if request.nextUrl.origin is localhost
    const baseUrl = 
      request.nextUrl.origin.includes('localhost') && process.env.NEXT_PUBLIC_SITE_URL
        ? process.env.NEXT_PUBLIC_SITE_URL
        : request.nextUrl.origin;
    
    const _fullPublicUrl = new URL(publicPath, baseUrl).toString();

    try {
      // Determine which OMR processing method to use
      const useNewService = shouldUseNewService();
      const isVercel = process.env.VERCEL === '1';

      if (DEBUG) {
        logger.log(`[${requestId}] Using ${useNewService ? 'NEW HTTP' : 'LEGACY Python'} service`);
        logger.log(`[${requestId}] Environment: ${isVercel ? 'Vercel (serverless)' : 'VPS/Local'}`);
      }

      let omrResult: OMRResult;

      if (useNewService) {
        // Process with new HTTP service
        try {
          const blob = new Blob([fileBuffer], { type: scan.type });
          const serviceResult = await processWithNewOMRService(blob);

          if (!serviceResult.success) {
            // Fallback to legacy only if NOT on Vercel (no Python available there)
            if (isVercel) {
              logger.error('[OMR] New service failed on Vercel, no fallback available');
              throw new Error(`OMR service failed: ${serviceResult.error || 'Unknown error'}`);
            }

            logger.warn('[OMR] New service failed, falling back to legacy');
            omrResult = await runOMRScript(filePath, jobId);
          } else {
            // Transform service result to OMRResult format
            omrResult = {
              qr_data: serviceResult.qr_data ?? undefined,
              answers: (serviceResult.answers || []).map(ans => ({
                question_number: ans.number,
                answer_value: ans.value ?? '',
                confidence: ans.confidence,
                number: ans.number,
                value: ans.value ?? '',
              })),
            };

            // Store processed image from base64 if available
            if (serviceResult.processed_image) {
              // Extract base64 data (remove data:image/jpeg;base64, prefix)
              const base64Data = serviceResult.processed_image.replace(/^data:image\/\w+;base64,/, '');
              const imageBuffer = Buffer.from(base64Data, 'base64');

              // Save processed image to disk
              const originalFileNameWithoutExt = path.basename(filePath, `.${extension}`);
              const processedFileName = `${originalFileNameWithoutExt}questions_detected.jpeg`;
              const processedImagePath = path.join(uploadsDir, processedFileName);

              await fs.writeFile(processedImagePath, imageBuffer);

              omrResult.processed_image_path = processedImagePath;

              // In Vercel, also include base64 since files in /tmp are not publicly accessible
              // In VPS, this is optional but can be useful for immediate display
              if (isVercel) {
                omrResult.processed_image_base64 = serviceResult.processed_image;
              }

              if (DEBUG) {
                logger.log(`[${requestId}] Saved processed image from HTTP service:`, processedImagePath);
                if (isVercel) {
                  logger.log(`[${requestId}] Including base64 image in response (Vercel environment)`);
                }
              }
            }
          }
        } catch (httpError) {
          // Fallback to legacy only if NOT on Vercel
          if (isVercel) {
            logger.error('[OMR] HTTP service error on Vercel, no fallback available:', httpError);
            throw httpError;
          }

          logger.error('[OMR] HTTP service error, falling back to legacy:', httpError);
          omrResult = await runOMRScript(filePath, jobId);
        }
      } else {
        // Process with legacy Python script (not available on Vercel)
        if (isVercel) {
          const { t } = await getApiTranslator(request, 'exams.process-scan');
          throw new Error(t('OMR legacy service not available on Vercel. Set OMR_USE_NEW_SERVICE=true'));
        }

        omrResult = await runOMRScript(filePath, jobId);
      }
      
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      
      // Handle the processed image path
      // If using new service, the image was already saved; if using legacy, need to find it
      let processedImagePath: string;
      let processedFileName: string;

      if (normalizedResult.processed_image_path) {
        // New service: image already saved, use the path from result
        processedImagePath = normalizedResult.processed_image_path;
        processedFileName = path.basename(processedImagePath);

        if (DEBUG) {
          logger.log(`[${requestId}] Using processed image path from new service:`, processedImagePath);
        }
      } else {
        // Legacy service: the Python script appends "questions_detected.jpeg" to the original filename
        if (DEBUG) {
          logger.log(`[${requestId}] OMR script completed, waiting for file system updates...`);
        }

        // Wait for a moment to let the file system catch up
        await new Promise(resolve => setTimeout(resolve, 500));

        const originalDir = path.dirname(filePath);
        const originalFileNameWithoutExt = path.basename(filePath, `.${extension}`);
        processedFileName = `${originalFileNameWithoutExt}questions_detected.jpeg`;
        processedImagePath = path.join(originalDir, processedFileName);

        // Check if the processed image exists
        try {
          await fs.access(processedImagePath);
          if (DEBUG) {
            logger.log(`[${requestId}] Processed image found at:`, processedImagePath);
          }
        } catch (_error) {
          if (DEBUG) {
            logger.error(`[${requestId}] Processed image not found at expected path:`, processedImagePath);
          }
          const { t } = await getApiTranslator(request, 'exams.process-scan');
          return NextResponse.json({
            success: false,
            error: t('errors.processedNotFound'),
            error_details: { message: "No se pudo encontrar la imagen procesada" }
          }, { status: 500 });
        }
      }

      // Build response
      const response: Record<string, unknown> = {
        success: true,
        result: {
          ...normalizedResult,
          qr_data: normalizedResult.qr_data,
          answers: normalizedResult.answers,
          processed_image_path: processedImagePath,
          student_info: normalizedResult.student_info
        },
        publicUrl: _fullPublicUrl,
      };

      // In Vercel, include base64 image since /uploads directory doesn't exist
      // In VPS, construct and include public URL to the uploaded file
      if (isVercel && omrResult.processed_image_base64) {
        // Vercel: Return base64 directly
        response.processedImage = omrResult.processed_image_base64;
        if (DEBUG) {
          logger.log(`[${requestId}] Including base64 processed image for Vercel (${omrResult.processed_image_base64.length} chars)`);
        }
      } else {
        // VPS: Construct public URL
        const processedPublicPath = `/uploads/omr/${processedFileName}`;
        const timestamp = Date.now();
        const processedPublicPathWithTimestamp = `${processedPublicPath}?t=${timestamp}`;
        const processedPublicUrl = new URL(processedPublicPathWithTimestamp, request.nextUrl.origin).toString();

        response.processedImageUrl = processedPublicUrl;

        if (DEBUG) {
          logger.log(`[${requestId}] Original URL: ${_fullPublicUrl}`);
          logger.log(`[${requestId}] Processed URL with timestamp: ${processedPublicUrl}`);
        }
      }

      return NextResponse.json(response);
      
    } catch (error) {
      // Log error and return error response
      if (DEBUG) {
        logger.error('Error processing scan:', error);
      }
      const { t } = await getApiTranslator(request, 'exams.process-scan');
      return NextResponse.json({ 
        success: false, 
        error: t('errors.processError'),
        error_details: { message: error instanceof Error ? error.message : 'Unknown error' }
      }, { status: 500 });
    }
  } catch (error) {
    // Log error and return error response for outer try block
    if (DEBUG) {
      logger.error('Error in process-scan endpoint:', error);
    }
    const { t } = await getApiTranslator(request, 'exams.process-scan');
    return NextResponse.json({ 
      success: false, 
      error: t('errors.internal'),
      error_details: { message: error instanceof Error ? error.message : 'Unknown error' }
    }, { status: 500 });
  }
}