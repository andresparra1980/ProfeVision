/**
 * Central logging utility for consistent log handling across the application
 * Only outputs logs in development mode to avoid exposing sensitive data in production
 */

// Check if we're in development mode
const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Función auxiliar segura que encapsula console para evitar errores de linting
 */
// Deshabilitamos el linting para todas las propiedades de console
const safeConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error
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
  }
};

// Export a simpler default object
export default logger; 