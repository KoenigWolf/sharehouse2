"use server";

import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/errors";
import { getServerTranslator } from "@/lib/i18n/server";
import { enforceAllowedOrigin } from "@/lib/security/request";

export type ThemeStyle = "modern" | "cottage";
export type ColorMode = "light" | "dark" | "system";

type UpdateResponse = { success: true } | { error: string };

interface ThemePreferences {
  theme_style: ThemeStyle | null;
  color_mode: ColorMode | null;
}

function isValidThemeStyle(value: string): value is ThemeStyle {
  return value === "modern" || value === "cottage";
}

function isValidColorMode(value: string): value is ColorMode {
  return value === "light" || value === "dark" || value === "system";
}

/**
 * ユーザーのテーマ設定を取得する
 */
export async function getThemePreferences(): Promise<ThemePreferences | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("theme_style, color_mode")
      .eq("id", user.id)
      .single();

    if (error) {
      logError(error, { action: "getThemePreferences", userId: user.id });
      return null;
    }

    return {
      theme_style: data?.theme_style as ThemeStyle | null,
      color_mode: data?.color_mode as ColorMode | null,
    };
  } catch (error) {
    logError(error, { action: "getThemePreferences" });
    return null;
  }
}

/**
 * ユーザーのテーマ設定を更新する
 */
export async function updateThemePreferences(
  themeStyle: ThemeStyle,
  colorMode: ColorMode
): Promise<UpdateResponse> {
  const t = await getServerTranslator();

  const originError = await enforceAllowedOrigin(t, "updateThemePreferences");
  if (originError) {
    return { error: originError };
  }

  if (!isValidThemeStyle(themeStyle) || !isValidColorMode(colorMode)) {
    return { error: t("errors.invalidInput") };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: t("errors.unauthorized") };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        theme_style: themeStyle,
        color_mode: colorMode,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      logError(error, { action: "updateThemePreferences", userId: user.id });
      return { error: t("errors.saveFailed") };
    }

    return { success: true };
  } catch (error) {
    logError(error, { action: "updateThemePreferences" });
    return { error: t("errors.serverError") };
  }
}
