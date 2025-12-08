/**
 * Polar.sh configuration
 * Centralizes API URLs and settings for sandbox/production environments
 */

const isPolarSandbox = process.env.POLAR_ENVIRONMENT === 'sandbox';

export const POLAR_CONFIG = {
  /**
   * Base API URL - switches between sandbox and production
   */
  apiUrl: isPolarSandbox
    ? 'https://sandbox-api.polar.sh'
    : 'https://api.polar.sh',

  /**
   * API endpoints
   */
  endpoints: {
    checkouts: '/v1/checkouts/custom/',
    customerSessions: '/v1/customer-sessions/',
  },

  /**
   * Whether we're in sandbox mode
   */
  isSandbox: isPolarSandbox,
} as const;

/**
 * Get full URL for a Polar API endpoint
 */
export function getPolarEndpoint(endpoint: keyof typeof POLAR_CONFIG.endpoints): string {
  return `${POLAR_CONFIG.apiUrl}${POLAR_CONFIG.endpoints[endpoint]}`;
}
