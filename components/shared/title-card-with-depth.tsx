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
        // Base card styling
        'rounded-xl border bg-card text-card-foreground',
        // Inverted glow effect - dark shadow in light mode
        'shadow-[0_8px_30px_rgb(0,0,0,0.12),0_2px_10px_rgb(0,0,0,0.08)]',
        'hover:shadow-[0_12px_40px_rgb(0,0,0,0.15),0_4px_15px_rgb(0,0,0,0.1)]',
        // Enhanced light glow in dark mode (less subtle, more pronounced)
        'dark:shadow-[0_8px_30px_rgba(255,255,255,0.12),0_2px_10px_rgba(255,255,255,0.08),0_0_60px_rgba(255,255,255,0.04)]',
        'dark:hover:shadow-[0_12px_40px_rgba(255,255,255,0.16),0_4px_15px_rgba(255,255,255,0.1),0_0_80px_rgba(255,255,255,0.06)]',
        // Smooth transition
        'transition-all duration-300',
        // Enhanced border with glow
        'border-border/50 dark:border-border/30',
        // Subtle background enhancement
        'bg-gradient-to-br from-card to-card/95',
        // Responsive padding - much more compact vertically on mobile, especially top
        'px-4 pt-1.5 pb-2 sm:p-6',
        className
      )}
      style={{
        boxShadow: 'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)',
      }}
    >
      <div className="flex flex-row flex-wrap justify-between items-center gap-3 sm:gap-4">
        {/* Title and description section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-3 flex-1 min-w-[400px]">
          {/* Optional icon */}
          {icon && (
            <div className="flex-shrink-0 mt-0 sm:mt-1">
              {icon}
            </div>
          )}

          {/* Text content */}
          <div className="flex-1 min-w-0 text-center sm:text-left overflow-hidden">
            <h2
              className={cn(
                // Enhanced font styling
                'text-3xl font-extrabold tracking-tight',
                // Enhanced gradient text effect - more pronounced for consistency
                'bg-gradient-to-br from-foreground via-foreground to-foreground/80',
                'dark:from-foreground dark:via-foreground dark:to-foreground/70',
                'bg-clip-text text-transparent',
                // Enhanced text shadow for depth - visible on all screen sizes
                '[text-shadow:0_2px_12px_rgba(0,0,0,0.15),0_1px_4px_rgba(0,0,0,0.1)]',
                'dark:[text-shadow:0_2px_18px_rgba(255,255,255,0.15),0_1px_6px_rgba(255,255,255,0.1)]',
                // Letter spacing for elegance
                'tracking-tight leading-tight',
                // Minimal margin on desktop
                'mb-0 sm:mb-1.5',
                // Allow text to wrap if too long
                'break-words',
                // Truncate after 5 lines
                'line-clamp-5',
                titleClassName
              )}
            >
              {title}
            </h2>
            {description && (
              <p
                className={cn(
                  // Enhanced description styling
                  'text-sm font-medium text-muted-foreground/90',
                  'dark:text-muted-foreground/80',
                  // Subtle shadow
                  '[text-shadow:0_1px_2px_rgba(0,0,0,0.05)]',
                  'dark:[text-shadow:0_1px_3px_rgba(0,0,0,0.3)]',
                  // Better readability
                  'leading-snug sm:leading-relaxed tracking-wide',
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
