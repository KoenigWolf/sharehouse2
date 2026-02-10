"use server";

import { createClient } from "@/lib/supabase/server";
import { CacheStrategy } from "@/lib/utils/cache";
import { EVENTS } from "@/lib/constants/config";
import { logError } from "@/lib/errors";
import { getServerTranslator } from "@/lib/i18n/server";
import { enforceAllowedOrigin } from "@/lib/security/request";
import { isValidUUID } from "@/lib/security";
import type { EventWithDetails } from "@/domain/event";

type ActionResponse = { success: true } | { error: string };

export async function getUpcomingEvents(): Promise<EventWithDetails[]> {
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("events")
      .select("*, profiles!events_user_id_profiles_fk(name, nickname, avatar_url), event_attendees(user_id, profiles!event_attendees_user_id_profiles_fk(name, nickname, avatar_url))")
      .gte("event_date", today)
      .order("event_date", { ascending: true });

    if (error || !data) {
      if (error) logError(error, { action: "getUpcomingEvents" });
      return [];
    }
    return data as EventWithDetails[];
  } catch (error) {
    logError(error, { action: "getUpcomingEvents" });
    return [];
  }
}

export async function createEvent(input: {
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
}): Promise<ActionResponse> {
  const t = await getServerTranslator();
  const originError = await enforceAllowedOrigin(t, "createEvent");
  if (originError) return { error: originError };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: t("errors.unauthorized") };

    const trimmedTitle = input.title.trim();
    if (!trimmedTitle) return { error: t("errors.invalidInput") };
    if (trimmedTitle.length > EVENTS.maxTitleLength) {
      return { error: t("errors.invalidInput") };
    }

    if (!input.event_date) return { error: t("errors.invalidInput") };

    const trimmedDesc = input.description?.trim() || null;
    if (trimmedDesc && trimmedDesc.length > EVENTS.maxDescriptionLength) {
      return { error: t("errors.invalidInput") };
    }

    const { error } = await supabase.from("events").insert({
      user_id: user.id,
      title: trimmedTitle,
      description: trimmedDesc,
      event_date: input.event_date,
      event_time: input.event_time?.trim() || null,
      location: input.location?.trim() || null,
    });

    if (error) {
      logError(error, { action: "createEvent", userId: user.id });
      return { error: t("errors.saveFailed") };
    }

    CacheStrategy.afterEventUpdate();
    return { success: true };
  } catch (error) {
    logError(error, { action: "createEvent" });
    return { error: t("errors.serverError") };
  }
}

export async function toggleAttendance(eventId: string): Promise<ActionResponse> {
  const t = await getServerTranslator();
  const originError = await enforceAllowedOrigin(t, "toggleAttendance");
  if (originError) return { error: originError };

  try {
    if (!isValidUUID(eventId)) return { error: t("errors.invalidIdFormat") };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: t("errors.unauthorized") };

    const { data: existing } = await supabase
      .from("event_attendees")
      .select("event_id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      const { error } = await supabase
        .from("event_attendees")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", user.id);

      if (error) {
        logError(error, { action: "toggleAttendance:remove", userId: user.id });
        return { error: t("errors.saveFailed") };
      }
    } else {
      const { error } = await supabase.from("event_attendees").insert({
        event_id: eventId,
        user_id: user.id,
      });

      if (error) {
        logError(error, { action: "toggleAttendance:add", userId: user.id });
        return { error: t("errors.saveFailed") };
      }
    }

    CacheStrategy.afterEventUpdate();
    return { success: true };
  } catch (error) {
    logError(error, { action: "toggleAttendance" });
    return { error: t("errors.serverError") };
  }
}

export async function updateEvent(
  eventId: string,
  input: {
    title: string;
    description: string | null;
    event_date: string;
    event_time: string | null;
    location: string | null;
  }
): Promise<ActionResponse> {
  const t = await getServerTranslator();
  const originError = await enforceAllowedOrigin(t, "updateEvent");
  if (originError) return { error: originError };

  try {
    if (!isValidUUID(eventId)) return { error: t("errors.invalidIdFormat") };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: t("errors.unauthorized") };

    const trimmedTitle = input.title.trim();
    if (!trimmedTitle) return { error: t("errors.invalidInput") };
    if (trimmedTitle.length > EVENTS.maxTitleLength) {
      return { error: t("errors.invalidInput") };
    }

    if (!input.event_date) return { error: t("errors.invalidInput") };

    const trimmedDesc = input.description?.trim() || null;
    if (trimmedDesc && trimmedDesc.length > EVENTS.maxDescriptionLength) {
      return { error: t("errors.invalidInput") };
    }

    const { data, error } = await supabase
      .from("events")
      .update({
        title: trimmedTitle,
        description: trimmedDesc,
        event_date: input.event_date,
        event_time: input.event_time?.trim() || null,
        location: input.location?.trim() || null,
      })
      .eq("id", eventId)
      .eq("user_id", user.id)
      .select("id")
      .single();

    if (error || !data) {
      if (error) logError(error, { action: "updateEvent", userId: user.id });
      return { error: t("errors.saveFailed") };
    }

    CacheStrategy.afterEventUpdate();
    return { success: true };
  } catch (error) {
    logError(error, { action: "updateEvent" });
    return { error: t("errors.serverError") };
  }
}

export async function deleteEvent(eventId: string): Promise<ActionResponse> {
  const t = await getServerTranslator();
  const originError = await enforceAllowedOrigin(t, "deleteEvent");
  if (originError) return { error: originError };

  try {
    if (!isValidUUID(eventId)) return { error: t("errors.invalidIdFormat") };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: t("errors.unauthorized") };

    const { data, error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId)
      .eq("user_id", user.id)
      .select("id")
      .single();

    if (error || !data) {
      if (error) logError(error, { action: "deleteEvent", userId: user.id });
      return { error: t("errors.deleteFailed") };
    }

    CacheStrategy.afterEventUpdate();
    return { success: true };
  } catch (error) {
    logError(error, { action: "deleteEvent" });
    return { error: t("errors.serverError") };
  }
}
