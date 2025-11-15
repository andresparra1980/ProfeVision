import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 5; // Quick health check

/**
 * Health check endpoint for monitoring services
 * Tests connectivity to both microservices
 */
export async function GET() {
  const startTime = Date.now();

  const checks = {
    api: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.VERCEL === '1' ? 'vercel' : 'vps',
  };

  const services: Record<string, { healthy: boolean; latency?: number; error?: string }> = {};

  // Check LaTeX service
  if (process.env.LATEX_SERVICE_URL) {
    try {
      const latexStart = Date.now();
      const response = await fetch(`${process.env.LATEX_SERVICE_URL}/health`, {
        signal: AbortSignal.timeout(3000), // 3s timeout
      });

      services.latex = {
        healthy: response.ok,
        latency: Date.now() - latexStart,
      };
    } catch (error) {
      services.latex = {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Check OMR service
  if (process.env.OMR_SERVICE_URL) {
    try {
      const omrStart = Date.now();
      const response = await fetch(`${process.env.OMR_SERVICE_URL}/health`, {
        signal: AbortSignal.timeout(3000), // 3s timeout
      });

      services.omr = {
        healthy: response.ok,
        latency: Date.now() - omrStart,
      };
    } catch (error) {
      services.omr = {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Check Supabase (optional - may increase latency)
  // if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  //   try {
  //     const supabaseStart = Date.now();
  //     const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
  //       headers: {
  //         'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  //       },
  //       signal: AbortSignal.timeout(3000),
  //     });
  //
  //     services.supabase = {
  //       healthy: response.ok,
  //       latency: Date.now() - supabaseStart,
  //     };
  //   } catch (error) {
  //     services.supabase = {
  //       healthy: false,
  //       error: error instanceof Error ? error.message : 'Unknown error',
  //     };
  //   }
  // }

  const allHealthy = Object.values(services).every(s => s.healthy);
  const totalLatency = Date.now() - startTime;

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      ...checks,
      services,
      total_latency_ms: totalLatency,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
