/**
 * Profile utility functions (client-safe)
 */

/**
 * モックプロフィールIDかどうかを判定
 */
export function isMockProfile(id: string): boolean {
  return id.startsWith("mock-");
}
