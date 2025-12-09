/**
 * ProgressMessages Component
 *
 * Displays real-time progress messages during AI exam generation.
 * Shows step-by-step updates with emojis and smooth animations.
 *
 * Features:
 * - Animated message list with CSS animations
 * - Emoji support for visual clarity
 * - Auto-scroll to latest message
 * - Fade in animations
 *
 * @see mddocs/ai_chat_mastra/TASKS_BY_PHASE.md - Tarea 2.3
 */

'use client';

import { useEffect, useRef, useState } from 'react';

export interface ProgressMessage {
  id: string;
  text: string;
  emoji?: string;
  timestamp: number;
}

interface ProgressMessagesProps {
  messages: ProgressMessage[];
  className?: string;
}

/**
 * ProgressMessages Component
 *
 * @example
 * ```tsx
 * const messages = [
 *   { id: '1', text: 'Planning exam structure...', emoji: '📋', timestamp: Date.now() },
 *   { id: '2', text: 'Generating questions 1-5...', emoji: '🔄', timestamp: Date.now() },
 * ];
 *
 * <ProgressMessages messages={messages} />
 * ```
 */
export function ProgressMessages({ messages, className = '' }: ProgressMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleMessages, setVisibleMessages] = useState<Set<string>>(new Set());

  /**
   * Auto-scroll to latest message
   */
  useEffect(() => {
    if (messages.length > 0 && containerRef.current) {
      // Scroll to bottom with smooth behavior
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });

      // Mark messages as visible with stagger effect
      messages.forEach((msg, index) => {
        setTimeout(() => {
          setVisibleMessages((prev) => new Set(prev).add(msg.id));
        }, index * 50);
      });
    }
  }, [messages]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`space-y-2 py-4 max-h-40 overflow-y-auto ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Progress updates"
    >
      {messages.map((msg) => {
        const isVisible = visibleMessages.has(msg.id);
        return (
          <div
            key={msg.id}
            className={`flex items-center gap-2 text-xs sm:text-sm text-white dark:text-foreground transition-all duration-300 ${
              isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-2'
            }`}
          >
            {msg.emoji && (
              <span
                className={`flex-shrink-0 transition-transform duration-300 ${
                  isVisible ? 'scale-100' : 'scale-0'
                }`}
                style={{
                  transitionDelay: '100ms',
                }}
                aria-hidden="true"
              >
                {msg.emoji}
              </span>
            )}
            <span className="flex-1">{msg.text}</span>
            <span
              className={`text-xs text-white/70 dark:text-foreground/70 flex-shrink-0 transition-opacity duration-300 ${
                isVisible ? 'opacity-70' : 'opacity-0'
              }`}
            >
              {formatTimestamp(msg.timestamp)}
            </span>
          </div>
        );
      })}

      {/* Loading indicator (pulse) */}
      {messages.length > 0 && (
        <div className="flex items-center gap-1.5 mt-2" aria-label="Processing">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse"
              style={{
                animationDelay: `${i * 200}ms`,
                animationDuration: '1s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Format timestamp to relative time
 */
function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 1000) return 'now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  return `${Math.floor(diff / 3600000)}h`;
}
