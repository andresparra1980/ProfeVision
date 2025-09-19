import { v4 as uuidv4 } from 'uuid';

/**
 * Minimal LangSmith tracing helper stubs.
 * Replace with real client integration when credentials are configured.
 */
export interface TraceContext {
  runId: string;
  metadata?: Record<string, unknown>;
}

export function startTrace(meta?: Record<string, unknown>): TraceContext {
  return { runId: uuidv4(), metadata: meta };
}

export function logStep(ctx: TraceContext, step: string, data?: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.debug(`[LangSmith] step=${step}`, { runId: ctx.runId, ...data });
}

export function endTrace(ctx: TraceContext, status: 'succeeded' | 'failed', data?: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.debug(`[LangSmith] end status=${status}`, { runId: ctx.runId, ...data });
}
