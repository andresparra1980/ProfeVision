import * as React from 'react';
import { cn } from '@/lib/utils';

interface TitleCardWithDepthProps {
  /**
   * The main title text
   */
  title: React.ReactNode;
  /**
   * Optional subtitle/description text
   */
  description?: React.ReactNode;
  /**
   * Optional action buttons or elements to display on the right
   */
  actions?: React.ReactNode;
  /**
   * Optional icon or badge to display before the title
   */
  icon?: React.ReactNode;
  /**
   * Additional CSS classes for the container
   */
  className?: string;
  /**
   * Additional CSS classes for the title
   */
  titleClassName?: string;
  /**
   * Additional CSS classes for the description
   */
  descriptionClassName?: string;
}

/**
 * A prominent card component with enhanced depth and shadow,
 * designed for dashboard section titles and headers.
 *
 * Features:
 * - Inverted glow effect (dark shadow in light mode, light glow in dark mode)
 * - Enhanced typography with gradient text and text shadows
 * - Responsive layout (stacked on mobile, side-by-side on desktop)
 * - Support for icons, titles, descriptions, and action buttons
 *
 * @example
 * ```tsx
 * <TitleCardWithDepth
 *   title="Exam Results"
 *   description="View and manage student exam results"
 *   actions={<Button>Export</Button>}
 * />
 * ```
 */
export function TitleCardWithDepth({
  title,
  description,
  actions,
  icon,
  className,
  titleClassName,
  descriptionClassName,
}: TitleCardWithDepthProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-black/10 bg-gradient-to-br from-card via-card to-muted/20 text-card-foreground shadow-[0_24px_50px_-34px_rgba(15,23,42,0.35)] transition-all duration-300 dark:border-white/10 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900/70',
        'px-4 py-4 sm:p-6',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-sky-500/15 via-cyan-400/5 to-emerald-400/10 blur-2xl" />
      <div className="flex flex-row flex-wrap justify-between items-center gap-3 sm:gap-4">
        {/* Title and description section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-3 flex-1 min-w-0 w-full sm:w-auto">
          {/* Optional icon */}
          {icon && (
            <div className="flex-shrink-0 mt-0 sm:mt-1">
              {icon}
            </div>
          )}

          {/* Text content */}
          <div className="flex-1 min-w-0 w-full sm:w-auto text-center sm:text-left overflow-hidden">
            <h2
              className={cn(
                'mb-0 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:mb-1.5',
                'break-words line-clamp-5',
                titleClassName
              )}
            >
              {title}
            </h2>
            {description && (
              <p
                className={cn(
                  'text-sm font-medium leading-snug tracking-wide text-muted-foreground/90 sm:leading-relaxed',
                  descriptionClassName
                )}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Actions section */}
        {actions && (
          <div className="flex-shrink-0 w-full sm:w-auto">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
