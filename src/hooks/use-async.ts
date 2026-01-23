"use client";

import { useState, useCallback } from "react";

/**
 * Async operation state
 */
interface AsyncState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * Hook for managing async operations with loading and error states
 */
export function useAsync<T, Args extends unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setState({ data: null, error: null, isLoading: true });

      try {
        const result = await asyncFunction(...args);
        setState({ data: result, error: null, isLoading: false });
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "エラーが発生しました";
        setState({ data: null, error: errorMessage, isLoading: false });
        return null;
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, error: null, isLoading: false });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Hook for managing form submission with optimistic updates
 */
export function useOptimisticAction<T, R>(
  action: (data: T) => Promise<{ success?: boolean; error?: string } & R>,
  options?: {
    onSuccess?: (result: R) => void;
    onError?: (error: string) => void;
  }
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (data: T): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await action(data);

        if (result.error) {
          setError(result.error);
          options?.onError?.(result.error);
          setIsLoading(false);
          return false;
        }

        options?.onSuccess?.(result);
        setIsLoading(false);
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "エラーが発生しました";
        setError(errorMessage);
        options?.onError?.(errorMessage);
        setIsLoading(false);
        return false;
      }
    },
    [action, options]
  );

  return {
    isLoading,
    error,
    execute,
    clearError: () => setError(null),
  };
}
