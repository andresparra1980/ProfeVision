/**
 * Central logging utility for consistent log handling across the application
 * Only outputs logs in development mode to avoid exposing sensitive data in production
 */

// Check if we're in development mode or debug is explicitly enabled
const IS_DEV = process.env.NODE_ENV === "development" || process.env.ENABLE_DEBUG_LOGS === "true";

/**
 * Función auxiliar segura que encapsula console para evitar errores de linting
 */
// Deshabilitamos el linting para todas las propiedades de console
const safeConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
};

/**
 * Logger utility that only outputs in development environment
 */
export const logger = {
  /**
   * Log general information messages
   * @param message - The message to log
   * @param data - Optional data to include
   */
  log: (message: string, ...data: unknown[]) => {
    if (IS_DEV) {
      safeConsole.log(`[INFO] ${message}`, ...data);
    }
  },

  /**
   * Log warning messages
   * @param message - The warning message to log
   * @param data - Optional data to include
   */
  warn: (message: string, ...data: unknown[]) => {
    if (IS_DEV) {
      safeConsole.warn(`[WARN] ${message}`, ...data);
    }
  },

  /**
   * Log error messages
   * @param message - The error message to log
   * @param error - The error object or data to include
   */
  error: (message: string, error?: unknown) => {
    if (IS_DEV) {
      safeConsole.error(`[ERROR] ${message}`, error);
    }
  },

  /**
   * Log performance-related data
   * @param label - The performance label
   * @param data - Optional performance data
   */
  perf: (label: string, ...data: unknown[]) => {
    if (IS_DEV) {
      safeConsole.log(`[PERF] ${label}`, ...data);
    }
  },

  /**
   * Log API-related data
   * @param endpoint - The API endpoint
   * @param data - Optional API data
   */
  api: (endpoint: string, ...data: unknown[]) => {
    if (IS_DEV) {
      safeConsole.log(`[API] ${endpoint}`, ...data);
    }
  },

  /**
   * Always log auth-related issues, even in production, with safe data handling
   * For production, this excludes detailed user information but logs essential flow data
   * @param message - Auth-related message
   * @param data - Optional auth data (will be sanitized in production)
   */
  auth: (message: string, data?: Record<string, unknown>) => {
    // In development, log everything
    if (IS_DEV) {
      safeConsole.log(`[AUTH] ${message}`, data);
      return;
    }

    // In production, sanitize data before logging
    if (data) {
      // Create a sanitized copy of data
      const sanitizedData: Record<string, unknown> = {};

      // Include only safe properties, redact sensitive information
      Object.keys(data).forEach((key) => {
        if (key === "email" && typeof data[key] === "string") {
          // Mask email addresses
          sanitizedData[key] = (data[key] as string).replace(
            /(.{2})(.*)(@.*)/,
            "$1***$3"
          );
        } else if (
          ["token", "accessToken", "refreshToken", "password"].includes(key)
        ) {
          // For sensitive tokens, just indicate their presence but not the actual value
          sanitizedData[key] = data[key] ? "[REDACTED]" : null;
        } else if (key === "error" && data[key]) {
          // Include error message but not the full error object
          const err = data[key] as Error;
          sanitizedData[key] = err.message || "Unknown error";
        } else if (
          [
            "type",
            "flowType",
            "hasError",
            "hasSession",
            "status",
            "statusCode",
            "url",
          ].includes(key)
        ) {
          // Include general flow information
          sanitizedData[key] = data[key];
        }
        // Other keys are omitted for security
      });

      // Log the sanitized data
      safeConsole.log(`[AUTH] ${message}`, sanitizedData);
    } else {
      // If no data, just log the message
      safeConsole.log(`[AUTH] ${message}`);
    }
  },
};

// Export a simpler default object
export default logger;
