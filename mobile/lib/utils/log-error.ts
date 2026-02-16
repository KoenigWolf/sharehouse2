/**
 * Log errors consistently across the mobile app
 * In production, this could send to a monitoring service like Sentry
 */
export function logError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // In development, log to console for debugging
  if (__DEV__) {
    console.warn("[Error]", {
      message: errorMessage,
      stack: errorStack,
      ...context,
    });
  }

  // In production, you would send to a monitoring service
  // e.g., Sentry.captureException(error, { extra: context });
}
