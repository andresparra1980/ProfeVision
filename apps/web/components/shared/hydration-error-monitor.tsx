"use client";

import { useEffect } from "react";
import { logger } from "@/lib/utils/logger";

/**
 * Monitors for React hydration errors and logs them with additional context.
 * This component should be mounted as high as possible in the component tree.
 */
export function HydrationErrorMonitor() {
    useEffect(() => {
        const originalConsoleError = console.error;

        // Intercept console.error to catch React hydration warnings/errors
        console.error = (...args) => {
            const msg = args[0];

            // Known partial matches for hydration errors
            const isHydrationError =
                typeof msg === 'string' && (
                    msg.includes('Hydration broken') ||
                    msg.includes('Text content does not match server-rendered HTML') ||
                    msg.includes('Hydration failed because the initial UI does not match') ||
                    msg.includes('Minified React error #418') ||
                    msg.includes('Minified React error #423') ||
                    msg.includes('Minified React error #425')
                );

            if (isHydrationError) {
                logger.error('🚨 HYDRATION MISMATCH DETECTED:', { args });

                // Try to capture the html around the cursor if possible (for simple mismatches)
                // Note: In React 18/19, strict mode double invocation might make this noisy in dev,
                // but it is valuable in production.
            }

            // Always call the original error
            originalConsoleError.apply(console, args);
        };

        // Additionally listen for global error events
        const handleGlobalError = (event: ErrorEvent) => {
            if (
                event.message.includes('Minified React error #418') ||
                event.message.includes('Minified React error #423')
            ) {
                logger.error('🚨 GLOBAL HYDRATION ERROR (Window):', {
                    message: event.message,
                    stack: event.error?.stack,
                });
            }
        };

        window.addEventListener('error', handleGlobalError);

        return () => {
            console.error = originalConsoleError;
            window.removeEventListener('error', handleGlobalError);
        };
    }, []);

    return null;
}
