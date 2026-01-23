import type { Translator } from "@/lib/i18n";

interface AuthUser {
  id: string;
  user_metadata?: { name?: string } | null;
  email?: string | null;
}

export function createDefaultProfileData(userId: string, name: string) {
  return {
    id: userId,
    name: name.trim(),
    room_number: null,
    bio: null,
    avatar_url: null,
    interests: [],
    move_in_date: null,
  };
}

export function resolveFallbackName(user: AuthUser, t: Translator): string {
  return user.user_metadata?.name || user.email?.split("@")[0] || t("auth.defaultName");
}
