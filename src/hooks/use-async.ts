"use client";

import { useState, useCallback } from "react";
import { useI18n } from "@/hooks/use-i18n";

/**
 * Async operation state
 */
interface AsyncState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * 非同期操作の状態管理フック
 *
 * loading / error / data の3状態を管理し、execute()で非同期関数を実行する。
 * reset()で状態を初期値に戻せる。
 *
 * @typeParam T - 非同期関数の戻り値の型
 * @typeParam Args - 非同期関数の引数の型タプル
 * @param asyncFunction - 実行する非同期関数
 * @returns data, error, isLoading, execute, reset
 *
 * @example
 * ```tsx
 * const { data, isLoading, execute } = useAsync(fetchProfiles);
 * useEffect(() => { execute(); }, [execute]);
 * ```
 */
export function useAsync<T, Args extends unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>
) {
  const t = useI18n();
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
          err instanceof Error ? err.message : t("errors.unknownError");
        setState({ data: null, error: errorMessage, isLoading: false });
        return null;
      }
    },
    [asyncFunction, t]
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
 * フォーム送信の楽観的更新フック
 *
 * サーバーアクションの実行とloading/error状態を管理する。
 * 成功・失敗時のコールバックをoptions経由で受け取れる。
 *
 * @typeParam T - アクションに渡すデータの型
 * @typeParam R - アクションの戻り値の追加プロパティ型
 * @param action - 実行するサーバーアクション
 * @param options - 成功/失敗時のコールバック
 * @returns isLoading, error, execute, clearError
 */
export function useOptimisticAction<T, R>(
  action: (data: T) => Promise<{ success?: boolean; error?: string } & R>,
  options?: {
    onSuccess?: (result: R) => void;
    onError?: (error: string) => void;
  }
) {
  const t = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSuccess = options?.onSuccess;
  const onError = options?.onError;

  const execute = useCallback(
    async (data: T): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await action(data);

        if (result.error) {
          setError(result.error);
          onError?.(result.error);
          setIsLoading(false);
          return false;
        }

        onSuccess?.(result);
        setIsLoading(false);
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : t("errors.unknownError");
        setError(errorMessage);
        onError?.(errorMessage);
        setIsLoading(false);
        return false;
      }
    },
    [action, onSuccess, onError, t]
  );

  return {
    isLoading,
    error,
    execute,
    clearError: () => setError(null),
  };
}
