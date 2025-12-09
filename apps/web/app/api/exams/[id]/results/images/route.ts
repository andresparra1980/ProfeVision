import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import logger from '@/lib/utils/logger';
import { getApiTranslator } from '@/i18n/api';

// Create Supabase client for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// In Next.js 15, params are a Promise
type Params = Promise<{ id: string }>;

export const dynamic = 'force-dynamic';

/**
 * Fetch and optimize an image from Supabase Storage
 */
async function fetchAndOptimizeImage(filePath: string): Promise<string | null> {
  try {
    logger.log('Fetching image:', filePath);

    // Get signed URL
    const { data, error } = await supabase
      .storage
      .from('examenes-escaneados')
      .createSignedUrl(filePath, 3600);

    if (error || !data?.signedUrl) {
      logger.error('Error creating signed URL:', error);
      return null;
    }

    // Fetch image
    const response = await fetch(data.signedUrl);
    if (!response.ok) {
      logger.error('Error fetching image:', response.statusText);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check if buffer is valid
    if (!buffer || buffer.length === 0) {
      logger.error('Invalid or empty image buffer');
      return null;
    }

    // Optimize image with Sharp
    const optimizedBuffer = await sharp(buffer)
      .resize(800, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .png({
        quality: 80,
        compressionLevel: 9
      })
      .toBuffer();

    // Convert to base64
    const base64 = optimizedBuffer.toString('base64');
    return base64;
  } catch (error) {
    logger.error('Error in fetchAndOptimizeImage:', error);
    return null;
  }
}

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { t } = await getApiTranslator(request as unknown as NextRequest, 'exams.id.results.images');

    // Resolve params
    const resolvedParams = await params;
    const examId = resolvedParams.id;

    // Parse query parameters
    const url = new URL(request.url);
    const groupId = url.searchParams.get('groupId');

    logger.log('Fetching optimized images for exam:', examId, 'group:', groupId);

    if (!examId) {
      return NextResponse.json(
        { error: t?.('errors.missingExamId') || 'Missing exam ID' },
        { status: 400 }
      );
    }

    // Fetch results
    const { data: resultsData, error: resultsError } = await supabase
      .from('resultados_examen')
      .select(`
        id,
        estudiante_id,
        examenes_escaneados(
          id,
          ruta_s3_procesado
        )
      `)
      .eq('examen_id', examId);

    if (resultsError) {
      logger.error('Error fetching results:', resultsError);
      return NextResponse.json(
        { error: t?.('errors.resultsNotFound') || 'Results not found' },
        { status: 500 }
      );
    }

    // Filter by group if specified
    let filteredResults = resultsData || [];
    if (groupId) {
      const { data: estudiantesDelGrupo } = await supabase
        .from('estudiante_grupo')
        .select('estudiante_id')
        .eq('grupo_id', groupId);

      const estudianteIds = estudiantesDelGrupo?.map(e => e.estudiante_id) || [];
      filteredResults = resultsData?.filter(result =>
        estudianteIds.includes(result.estudiante_id)
      ) || [];
    }

    // Process images in parallel
    const imagePromises = filteredResults.map(async (result) => {
      const examenesEscaneados = result.examenes_escaneados as Array<{ ruta_s3_procesado?: string }>;
      const examenEscaneado = examenesEscaneados?.[0];

      if (examenEscaneado?.ruta_s3_procesado) {
        const optimizedImage = await fetchAndOptimizeImage(examenEscaneado.ruta_s3_procesado);
        return {
          resultId: result.id,
          imagenBase64: optimizedImage
        };
      }

      return {
        resultId: result.id,
        imagenBase64: null
      };
    });

    const images = await Promise.all(imagePromises);

    logger.log('Optimized images count:', images.filter(i => i.imagenBase64).length);

    return NextResponse.json({
      success: true,
      images
    });

  } catch (error) {
    logger.error('Error in images API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
