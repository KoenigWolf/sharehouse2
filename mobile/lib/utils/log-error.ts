/**
 * Log errors consistently across the mobile app
 * In production, this could send to a monitoring service like Sentry
 */
export function logError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  let errorMessage: string;
  let errorStack: string | undefined;

  if (error instanceof Error) {
    errorMessage = error.message;
    errorStack = error.stack;
  } else if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    // Handle Supabase errors and other objects with message property
    errorMessage = String((error as { message: unknown }).message);
  } else {
    errorMessage = String(error);
  }

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
