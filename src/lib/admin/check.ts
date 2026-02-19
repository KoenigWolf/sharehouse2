"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Translator } from "@/lib/i18n";

// In-memory cache for admin status (5 minute TTL)
const ADMIN_CACHE_TTL_MS = 5 * 60 * 1000;
const adminCache = new Map<string, { isAdmin: boolean; expiresAt: number }>();

/**
 * Check admin status with caching
 * Uses both request-level (React cache) and cross-request (in-memory) caching
 */
async function checkAdminStatus(userId: string): Promise<boolean> {
  // Check in-memory cache first
  const cached = adminCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.isAdmin;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();

  const isAdmin = data?.is_admin === true;

  // Cache the result
  adminCache.set(userId, {
    isAdmin,
    expiresAt: Date.now() + ADMIN_CACHE_TTL_MS,
  });

  // Cleanup old entries periodically
  if (adminCache.size > 1000) {
    const now = Date.now();
    for (const [key, value] of adminCache) {
      if (value.expiresAt < now) {
        adminCache.delete(key);
      }
    }
  }

  return isAdmin;
}

// Request-level cache for deduplication within the same request
const getCachedAdminStatus = cache(checkAdminStatus);

/**
 * 現在ログイン中のユーザーが管理者かどうかを確認する
 *
 * @returns 管理者の場合 true
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    return getCachedAdminStatus(user.id);
  } catch {
    return false;
  }
}

/**
 * Clear admin cache for a specific user (call after admin status changes)
 */
export async function clearAdminCache(userId: string): Promise<void> {
  adminCache.delete(userId);
}

/**
 * 管理者権限を要求する（サーバーアクション用ガード）
 *
 * @param t - 翻訳関数
 * @returns 管理者でない場合はエラーメッセージ、管理者の場合は null
 */
export async function requireAdmin(t: Translator): Promise<string | null> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) return t("errors.forbidden");
  return null;
}
