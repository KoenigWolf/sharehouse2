"use server";

import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/errors";
import { getServerTranslator } from "@/lib/i18n/server";
import { enforceAllowedOrigin } from "@/lib/security/request";
import { checkRateLimitAsync } from "@/lib/security/rate-limit";

export type ThemeStyle = "modern" | "cottage";
export type ColorMode = "light" | "dark" | "system";

type UpdateResponse = { success: true } | { error: string };

interface ThemePreferences {
  theme_style: ThemeStyle | null;
  color_mode: ColorMode | null;
}

function isValidThemeStyle(value: unknown): value is ThemeStyle {
  return value === "modern" || value === "cottage";
}

function isValidColorMode(value: unknown): value is ColorMode {
  return value === "light" || value === "dark" || value === "system";
}

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

    // Validate DB values before returning to prevent invalid data from propagating
    return {
      theme_style: isValidThemeStyle(data?.theme_style) ? data.theme_style : null,
      color_mode: isValidColorMode(data?.color_mode) ? data.color_mode : null,
    };
  } catch (error) {
    logError(error, { action: "getThemePreferences" });
    return null;
  }
}

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

    // Rate limit to prevent abuse
    const rateLimitResult = await checkRateLimitAsync(
      `updateThemePreferences:${user.id}`,
      { limit: 30, windowMs: 60_000 }
    );

    if (!rateLimitResult.success) {
      logError(new Error("Rate limit exceeded"), {
        action: "updateThemePreferences",
        userId: user.id,
        metadata: { remaining: rateLimitResult.remaining },
      });
      return { error: t("errors.rateLimitSeconds", { seconds: rateLimitResult.retryAfter }) };
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
