/**
 * StepProgressList Component
 *
 * Displays sequential progress steps with persistent state (in-progress → completed).
 * Similar to Vercel Agent UI style with spinner and checkmarks.
 *
 * Features:
 * - Step states: pending, in_progress, completed
 * - Persistent history (steps don't disappear when completed)
 * - Final LLM response text display
 * - Success message at the end
 *
 * @see mddocs/ai_chat_mastra/TASKS_BY_PHASE.md - Tarea 2.3 (Enhanced)
 */

'use client';

import { useEffect, useRef } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepStatus = 'pending' | 'in_progress' | 'completed';

export interface ProgressStep {
  id: string;
  label: string;
  status: StepStatus;
  timestamp: number;
}

export interface StepProgressListProps {
  steps: ProgressStep[];
  llmResponse?: string; // Final text from LLM
  successMessage?: string; // Success message after completion
  className?: string;
  progressAriaLabel: string;
}

/**
 * StepProgressList Component
 *
 * @example
 * ```tsx
 * const steps = [
 *   { id: 'plan', label: 'Planeando examen', status: 'completed', timestamp: Date.now() },
 *   { id: 'generate', label: 'Generando preguntas', status: 'in_progress', timestamp: Date.now() },
 * ];
 *
 * <StepProgressList
 *   steps={steps}
 *   llmResponse="He creado tu examen..."
 *   successMessage="Examen generado exitosamente"
 * />
 * ```
 */
export function StepProgressList({
  steps,
  llmResponse,
  successMessage,
  className = '',
  progressAriaLabel,
}: StepProgressListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when steps update
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [steps, llmResponse, successMessage]);

  if (steps.length === 0 && !llmResponse && !successMessage) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn('space-y-3 py-4 max-h-64 overflow-y-auto', className)}
      role="status"
      aria-live="polite"
      aria-label={progressAriaLabel}
    >
      {/* Steps list */}
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={cn(
            'flex items-start gap-3 text-sm transition-all duration-300',
            'animate-in fade-in slide-in-from-bottom-2',
            step.status === 'completed' && 'text-foreground/80',
            step.status === 'in_progress' && 'text-foreground',
            step.status === 'pending' && 'text-muted-foreground'
          )}
          style={{
            animationDelay: `${index * 50}ms`,
            animationDuration: '300ms',
            animationFillMode: 'backwards',
          }}
        >
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {step.status === 'completed' && (
              <div className="w-5 h-5 rounded-full bg-green-500/20 dark:bg-green-500/20 flex items-center justify-center">
                <Check className="w-3 h-3 text-green-500" strokeWidth={3} />
              </div>
            )}
            {step.status === 'in_progress' && (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            )}
            {step.status === 'pending' && (
              <div className="w-5 h-5 rounded-full border-2 border-black/20 dark:border-white/20" />
            )}
          </div>

          {/* Label */}
          <span className="flex-1 leading-relaxed">{step.label}</span>
        </div>
      ))}

      {/* LLM Response (if exists) */}
      {llmResponse && (
        <div
          className={cn(
            'mt-4 border-t border-black/10 pt-4 text-sm text-foreground/90 dark:border-white/10',
            'animate-in fade-in slide-in-from-bottom-2'
          )}
          style={{
            animationDelay: `${steps.length * 50}ms`,
            animationDuration: '300ms',
            animationFillMode: 'backwards',
          }}
        >
          {llmResponse}
        </div>
      )}

      {/* Success Message (if exists) */}
      {successMessage && (
        <div
          className={cn(
            'mt-3 flex items-center gap-2',
            'text-sm font-medium text-green-400 dark:text-green-500',
            'animate-in fade-in slide-in-from-bottom-2'
          )}
          style={{
            animationDelay: `${(steps.length + (llmResponse ? 1 : 0)) * 50}ms`,
            animationDuration: '300ms',
            animationFillMode: 'backwards',
          }}
        >
          <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <Check className="w-3 h-3 text-green-500" strokeWidth={3} />
          </div>
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
}
