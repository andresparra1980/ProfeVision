/**
 * Maps Supabase authentication errors to translation keys
 * @param error - The error object from Supabase
 * @param tErrors - Translation function for error messages
 * @returns Translated error message
 */
export function getAuthErrorMessage(
  error: unknown,
  tErrors: (_key: string) => string
): string {
  if (!(error instanceof Error)) {
    return tErrors('generalError');
  }

  const errorMessage = error.message.toLowerCase();

  // Login errors
  if (errorMessage.includes('invalid login credentials') || errorMessage.includes('invalid credentials')) {
    return tErrors('invalidLoginCredentials');
  }
  if (errorMessage.includes('email not confirmed')) {
    return tErrors('emailNotConfirmed');
  }

  // Registration errors
  if (errorMessage.includes('user already registered') || errorMessage.includes('already registered')) {
    return tErrors('userAlreadyRegistered');
  }

  // Rate limit errors
  if (errorMessage.includes('email rate limit') || errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    return errorMessage.includes('email') ? tErrors('emailRateLimit') : tErrors('tooManyRequests');
  }

  // Validation errors
  if (errorMessage.includes('invalid email')) {
    return tErrors('invalidEmailFormat');
  }
  if (errorMessage.includes('password') && errorMessage.includes('weak')) {
    return tErrors('weakPassword');
  }

  // User not found
  if (errorMessage.includes('user not found')) {
    return tErrors('userNotFound');
  }

  // Default to general error
  return tErrors('generalError');
}
