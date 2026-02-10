"use server";

import { createClient } from "@/lib/supabase/server";
import { CacheStrategy } from "@/lib/utils/cache";
import { EVENTS } from "@/lib/constants/config";
import { logError } from "@/lib/errors";
import { getServerTranslator } from "@/lib/i18n/server";
import { enforceAllowedOrigin } from "@/lib/security/request";
import { isValidUUID, RateLimiters, formatRateLimitError } from "@/lib/security";
import { validateFileUpload, sanitizeFileName } from "@/domain/validation/profile";
import type { EventWithDetails } from "@/domain/event";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Translator } from "@/lib/i18n";

type ActionResponse = { success: true } | { error: string };
type UploadResponse = { success: true; url: string } | { error: string };

type FileValidationResult =
  | { success: true; uint8Array: Uint8Array; fileName: string; contentType: string }
  | { success: false; error: string };

/**
 * Extract storage path from a cover image URL
 * Uses URL constructor to properly parse and exclude query strings
 */
function extractStoragePath(coverImageUrl: string): string | null {
  try {
    const url = new URL(coverImageUrl);
    const pathname = url.pathname;
    const marker = "/event-covers/";
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex === -1) return null;
    const path = pathname.slice(markerIndex + marker.length);
    // Trim leading/trailing slashes
    return path.replace(/^\/+|\/+$/g, "") || null;
  } catch {
    return null;
  }
}

/**
 * Delete a cover image from storage
 */
async function deleteStorageCover(
  supabase: SupabaseClient,
  coverImageUrl: string
): Promise<void> {
  const storagePath = extractStoragePath(coverImageUrl);
  if (storagePath) {
    await supabase.storage.from("event-covers").remove([storagePath]);
  }
}

/**
 * Validate file from FormData and read its contents
 */
async function validateAndReadFile(
  formData: FormData,
  userId: string,
  eventId: string,
  t: Translator
): Promise<FileValidationResult> {
  const fileEntry = formData.get("cover");

  if (!fileEntry || !(fileEntry instanceof File)) {
    return { success: false, error: t("errors.fileRequired") };
  }

  if (fileEntry.size === 0) {
    return { success: false, error: t("errors.fileRequired") };
  }

  const fileValidation = validateFileUpload(
    { size: fileEntry.size, type: fileEntry.type },
    t
  );
  if (!fileValidation.success) {
    return { success: false, error: fileValidation.error ?? t("errors.invalidFileType") };
  }

  const fileExt = fileEntry.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const sanitizedExt = sanitizeFileName(fileExt).slice(0, 10);
  const fileName = `${userId}/${eventId}.${sanitizedExt}`;

  const arrayBuffer = await fileEntry.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  return {
    success: true,
    uint8Array,
    fileName,
    contentType: fileEntry.type,
  };
}

/**
 * Upload cover to storage and persist URL to database
 */
async function uploadAndPersistCover(
  supabase: SupabaseClient,
  fileName: string,
  uint8Array: Uint8Array,
  contentType: string,
  eventId: string,
  userId: string,
  t: Translator
): Promise<UploadResponse> {
  const { error: uploadError } = await supabase.storage
    .from("event-covers")
    .upload(fileName, uint8Array, {
      contentType,
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    logError(uploadError, { action: "uploadEventCover", userId });
    return { error: t("errors.uploadFailed") };
  }

  const { data: urlData } = supabase.storage
    .from("event-covers")
    .getPublicUrl(fileName);

  const { error: updateError } = await supabase
    .from("events")
    .update({ cover_image_url: urlData.publicUrl })
    .eq("id", eventId)
    .eq("user_id", userId);

  if (updateError) {
    logError(updateError, { action: "uploadEventCover:update", userId });
    await supabase.storage.from("event-covers").remove([fileName]);
    return { error: t("errors.saveFailed") };
  }

  return { success: true, url: urlData.publicUrl };
}

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

/**
 * Get a single event by ID with full details
 */
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

/**
 * Upload event cover image
 */
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

    // Verify ownership
    if (event.user_id !== user.id) {
      logError(new Error("User is not the event owner"), {
        action: "uploadEventCover:ownership",
        userId: user.id,
        metadata: { eventId, eventOwnerId: event.user_id },
      });
      return { error: t("errors.notFound") };
    }

    const fileResult = await validateAndReadFile(formData, user.id, eventId, t);
    if (!fileResult.success) {
      return { error: fileResult.error };
    }

    if (event.cover_image_url) {
      await deleteStorageCover(supabase, event.cover_image_url);
    }

    const uploadResult = await uploadAndPersistCover(
      supabase,
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

/**
 * Remove event cover image
 */
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
      await deleteStorageCover(supabase, event.cover_image_url);
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
