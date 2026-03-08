"use server";

import { createClient } from "@/lib/supabase/server";
import { CacheStrategy } from "@/lib/utils/cache";
import { logError } from "@/lib/errors";
import { getServerTranslator } from "@/lib/i18n/server";
import { enforceAllowedOrigin } from "@/lib/security/request";
import { isValidUUID, RateLimiters, formatRateLimitError } from "@/lib/security";
import { eventSchema } from "@/domain/validation/schemas";
import {
  validateAndReadFile,
  uploadAndPersist,
  deleteStorageFile,
  type UploadResponse,
} from "@/lib/utils/storage";
import { toDateString } from "@/lib/utils/formatting";
import type { EventWithDetails } from "@/domain/event";
import type { ActionResponse, ActionResponseWith } from "@/lib/types/action-response";

const STORAGE_BUCKET = "event-covers";
const STORAGE_MARKER = `/${STORAGE_BUCKET}/`;
const UPLOAD_CONFIG = {
  bucket: STORAGE_BUCKET,
  table: "events",
  idColumn: "id",
  urlColumn: "cover_image_url",
  actionName: "uploadEventCover",
} as const;

export async function getUpcomingEvents(): Promise<EventWithDetails[]> {
  try {
    const supabase = await createClient();
    const today = toDateString();

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
}): Promise<ActionResponseWith<{ eventId: string }>> {
  const t = await getServerTranslator();
  const originError = await enforceAllowedOrigin(t, "createEvent");
  if (originError) return { error: originError };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: t("errors.unauthorized") };

    const rateLimitResult = RateLimiters.event(user.id);
    if (!rateLimitResult.success) {
      return { error: formatRateLimitError(rateLimitResult.retryAfter, t) };
    }

    const validation = eventSchema.safeParse(input);
    if (!validation.success) {
      return { error: validation.error.issues[0].message };
    }
    const validatedData = validation.data;

    const { data, error } = await supabase.from("events").insert({
      user_id: user.id,
      title: validatedData.title,
      description: validatedData.description ?? null,
      event_date: validatedData.event_date,
      event_time: validatedData.event_time ?? null,
      location: validatedData.location ?? null,
    }).select("id").single();

    if (error || !data) {
      if (error) logError(error, { action: "createEvent", userId: user.id });
      return { error: t("errors.saveFailed") };
    }

    CacheStrategy.afterEventUpdate();
    return { success: true, eventId: data.id };
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

    const validation = eventSchema.safeParse(input);
    if (!validation.success) {
      return { error: validation.error.issues[0].message };
    }
    const validatedData = validation.data;

    const { data, error } = await supabase
      .from("events")
      .update({
        title: validatedData.title,
        description: validatedData.description ?? null,
        event_date: validatedData.event_date,
        event_time: validatedData.event_time ?? null,
        location: validatedData.location ?? null,
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

export async function getEventById(eventId: string): Promise<EventWithDetails | null> {
  try {
    if (!isValidUUID(eventId)) return null;

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("events")
      .select("*, profiles!events_user_id_profiles_fk(name, nickname, avatar_url), event_attendees(user_id, profiles!event_attendees_user_id_profiles_fk(name, nickname, avatar_url))")
      .eq("id", eventId)
      .single();

    if (error || !data) {
      if (error) logError(error, { action: "getEventById" });
      return null;
    }

    return data as EventWithDetails;
  } catch (error) {
    logError(error, { action: "getEventById" });
    return null;
  }
}

export async function uploadEventCover(
  eventId: string,
  formData: FormData
): Promise<UploadResponse> {
  const t = await getServerTranslator();
  const originError = await enforceAllowedOrigin(t, "uploadEventCover");
  if (originError) return { error: originError };

  try {
    if (!isValidUUID(eventId)) return { error: t("errors.invalidInput") };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: t("errors.unauthorized") };

    const uploadRateLimit = RateLimiters.upload(user.id);
    if (!uploadRateLimit.success) {
      return { error: formatRateLimitError(uploadRateLimit.retryAfter, t) };
    }

    // First check if the event exists (without user_id filter for debugging)
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, cover_image_url, user_id")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      logError(eventError ?? new Error("Event not found"), {
        action: "uploadEventCover:findEvent",
        userId: user.id,
        metadata: { eventId },
      });
      return { error: t("errors.notFound") };
    }

    if (event.user_id !== user.id) {
      logError(new Error("User is not the event owner"), {
        action: "uploadEventCover:ownership",
        userId: user.id,
        metadata: { eventId, eventOwnerId: event.user_id },
      });
      return { error: t("errors.notFound") };
    }

    const fileResult = await validateAndReadFile(formData, "cover", user.id, eventId, t);
    if (!fileResult.success) {
      return { error: fileResult.error };
    }

    if (event.cover_image_url) {
      await deleteStorageFile(supabase, STORAGE_BUCKET, event.cover_image_url, STORAGE_MARKER);
    }

    const uploadResult = await uploadAndPersist(
      supabase,
      UPLOAD_CONFIG,
      fileResult.fileName,
      fileResult.uint8Array,
      fileResult.contentType,
      eventId,
      user.id,
      t
    );

    if ("error" in uploadResult) {
      return uploadResult;
    }

    CacheStrategy.afterEventUpdate();
    return uploadResult;
  } catch (error) {
    logError(error, { action: "uploadEventCover" });
    return { error: t("errors.serverError") };
  }
}

export async function removeEventCover(eventId: string): Promise<ActionResponse> {
  const t = await getServerTranslator();
  const originError = await enforceAllowedOrigin(t, "removeEventCover");
  if (originError) return { error: originError };

  try {
    if (!isValidUUID(eventId)) return { error: t("errors.invalidInput") };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: t("errors.unauthorized") };

    const rateLimit = RateLimiters.upload(user.id);
    if (!rateLimit.success) {
      return { error: formatRateLimitError(rateLimit.retryAfter, t) };
    }

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, cover_image_url, user_id")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      logError(eventError ?? new Error("Event not found"), {
        action: "removeEventCover:findEvent",
        userId: user.id,
        metadata: { eventId },
      });
      return { error: t("errors.notFound") };
    }

    if (event.user_id !== user.id) {
      logError(new Error("User is not the event owner"), {
        action: "removeEventCover:ownership",
        userId: user.id,
        metadata: { eventId, eventOwnerId: event.user_id },
      });
      return { error: t("errors.notFound") };
    }

    if (event.cover_image_url) {
      await deleteStorageFile(supabase, STORAGE_BUCKET, event.cover_image_url, STORAGE_MARKER);
    }

    const { error: updateError } = await supabase
      .from("events")
      .update({ cover_image_url: null })
      .eq("id", eventId)
      .eq("user_id", user.id);

    if (updateError) {
      logError(updateError, { action: "removeEventCover", userId: user.id });
      return { error: t("errors.saveFailed") };
    }

    CacheStrategy.afterEventUpdate();
    return { success: true };
  } catch (error) {
    logError(error, { action: "removeEventCover" });
    return { error: t("errors.serverError") };
  }
}
