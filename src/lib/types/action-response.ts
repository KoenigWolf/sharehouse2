/**
 * Unified server action response types.
 *
 * All server actions should return one of these types for consistency.
 * The discriminated union pattern allows type-safe handling in clients:
 *
 * @example
 * ```typescript
 * const result = await createItem(data);
 * if ("error" in result) {
 *   // Handle error
 *   showError(result.error);
 * } else {
 *   // Handle success
 *   console.log("Created:", result.data);
 * }
 * ```
 */

/**
 * Basic action response without data payload.
 * Use for operations that don't return data (delete, update, etc.)
 */
export type ActionResponse = { success: true } | { error: string };

/**
 * Action response with data payload.
 * Use for operations that return created/fetched data.
 *
 * @template T - The type of data returned on success
 */
export type ActionResponseWithData<T> =
  | { success: true; data: T }
  | { error: string };

/**
 * Type guard to check if response is successful
 */
export function isActionSuccess<T>(
  response: ActionResponse | ActionResponseWithData<T>
): response is { success: true } | { success: true; data: T } {
  return "success" in response && response.success === true;
}

/**
 * Type guard to check if response is an error
 */
export function isActionError(
  response: ActionResponse | ActionResponseWithData<unknown>
): response is { error: string } {
  return "error" in response;
}
