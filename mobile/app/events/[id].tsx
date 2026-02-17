import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { supabase, type Event } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { logError } from "../../lib/utils/log-error";
import { Avatar, AvatarGroup } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Colors, Shadows } from "../../constants/colors";
import { formatDate, formatTime } from "../../lib/utils";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEvent = useCallback(async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("events")
        .select("*, profiles(*), attendees:event_attendees(user_id, profiles(*))")
        .eq("id", id)
        .single();

      if (error) {
        logError(error, { fn: "fetchEvent", eventId: id });
        return;
      }

      setEvent(data as Event);
    } catch (error) {
      logError(error, { fn: "fetchEvent", eventId: id });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchEvent();
    setIsRefreshing(false);
  }, [fetchEvent]);

  const handleToggleAttendance = async () => {
    if (!user || !event) return;
    setIsToggling(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const isCurrentlyAttending = event.attendees?.some((a) => a.user_id === user.id);

    try {
      if (isCurrentlyAttending) {
        const { error } = await supabase
          .from("event_attendees")
          .delete()
          .eq("event_id", event.id)
          .eq("user_id", user.id);

        if (error) {
          logError(error, { fn: "handleToggleAttendance", action: "delete" });
          return;
        }
      } else {
        const { error } = await supabase.from("event_attendees").insert({
          event_id: event.id,
          user_id: user.id,
        });

        if (error) {
          logError(error, { fn: "handleToggleAttendance", action: "insert" });
          return;
        }
      }

      await fetchEvent();
    } catch (error) {
      logError(error, { fn: "handleToggleAttendance" });
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = () => {
    if (!event) return;

    Alert.alert(
      t("events.deleteTitle"),
      t("events.deleteMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

            try {
              const { error } = await supabase
                .from("events")
                .delete()
                .eq("id", event.id);

              if (error) {
                logError(error, { fn: "handleDelete", eventId: event.id });
                Alert.alert(t("common.error"), t("events.deleteError"));
                return;
              }

              router.back();
            } catch (error) {
              logError(error, { fn: "handleDelete" });
              Alert.alert(t("common.error"), t("events.deleteError"));
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const isOwner = event?.user_id === user?.id;
  const isAttending = event?.attendees?.some((a) => a.user_id === user?.id) ?? false;
  const attendeeCount = event?.attendees?.length ?? 0;
  const organizerName = event?.profiles?.nickname ?? event?.profiles?.name ?? "";

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={Colors.brand[500]} />
      </View>
    );
  }

  if (!event) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-4xl mb-4">😢</Text>
        <Text className="text-foreground text-lg font-bold">
          {t("events.notFound")}
        </Text>
        <Button
          variant="secondary"
          size="default"
          onPress={() => router.back()}
          className="mt-4"
        >
          {t("common.back")}
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: "",
          headerLeft: () => (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
              style={Shadows.sm}
            >
              <Text className="text-white text-lg">←</Text>
            </Pressable>
          ),
          headerRight: () =>
            isOwner ? (
              <Pressable
                onPress={handleDelete}
                disabled={isDeleting}
                className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
                style={Shadows.sm}
              >
                <Text className="text-white text-base">
                  {isDeleting ? "…" : "🗑"}
                </Text>
              </Pressable>
            ) : null,
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.brand[500]}
          />
        }
      >
        {/* Cover Image */}
        {event.image_url ? (
          <View className="relative" style={{ height: 280 }}>
            <Image
              source={{ uri: event.image_url }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={300}
            />
            {/* Overlay for readability */}
            <View
              className="absolute inset-x-0 bottom-0 h-20"
              style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
            />
          </View>
        ) : (
          <View
            className="bg-brand-100 items-center justify-center"
            style={{ height: 200, paddingTop: insets.top }}
          >
            <Text className="text-6xl">📅</Text>
          </View>
        )}

        {/* Content */}
        <View
          className="bg-card -mt-6 rounded-t-3xl"
          style={[Shadows.elevated, { paddingBottom: insets.bottom + 100 }]}
        >
          <View className="p-6">
            {/* Date Badge */}
            <View className="flex-row items-center mb-4">
              <Badge variant="primary" size="default">
                {formatDate(event.event_date)}
              </Badge>
              {event.event_time && (
                <Text className="text-muted-foreground text-sm ml-2">
                  {formatTime(event.event_time)}
                </Text>
              )}
            </View>

            {/* Title */}
            <Text
              className="text-foreground text-2xl font-bold mb-3"
              style={{ letterSpacing: -0.5 }}
            >
              {event.title}
            </Text>

            {/* Location */}
            {event.location && (
              <View className="flex-row items-center mb-4">
                <Text className="text-brand-500 mr-2">📍</Text>
                <Text className="text-foreground text-base">{event.location}</Text>
              </View>
            )}

            {/* Organizer */}
            <View className="flex-row items-center mb-6 pb-6 border-b border-border/40">
              <Avatar
                src={event.profiles?.avatar_url}
                name={organizerName}
                size={44}
                showRing
              />
              <View className="ml-3">
                <Text className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  {t("events.organizer")}
                </Text>
                <Text className="text-foreground font-semibold">
                  {organizerName}
                </Text>
              </View>
            </View>

            {/* Description */}
            {event.description && (
              <View className="mb-6">
                <Text className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">
                  {t("events.descriptionLabel")}
                </Text>
                <Text className="text-foreground text-base leading-6">
                  {event.description}
                </Text>
              </View>
            )}

            {/* Attendees */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  {t("events.attendeesTitle")}
                </Text>
                <Badge variant="outline">
                  {attendeeCount} {t("events.going")}
                </Badge>
              </View>

              {attendeeCount > 0 ? (
                <View className="flex-row flex-wrap gap-2">
                  {event.attendees?.map((attendee) => (
                    <Pressable
                      key={attendee.user_id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/profile/${attendee.user_id}`);
                      }}
                      className="flex-row items-center bg-muted/60 rounded-xl px-3 py-2"
                    >
                      <Avatar
                        src={attendee.profiles?.avatar_url}
                        name={attendee.profiles?.name ?? ""}
                        size={28}
                      />
                      <Text className="text-foreground text-sm font-medium ml-2">
                        {attendee.profiles?.nickname ?? attendee.profiles?.name ?? t("common.unregistered")}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View className="items-center py-6 bg-muted/30 rounded-xl">
                  <Text className="text-2xl mb-2">👋</Text>
                  <Text className="text-muted-foreground text-sm">
                    {t("events.noAttendees")}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-card border-t border-border/40"
        style={[Shadows.elevated, { paddingBottom: insets.bottom + 8 }]}
      >
        <View className="flex-row items-center gap-3 px-4 py-3">
          <View className="flex-1">
            <Button
              variant={isAttending ? "secondary" : "default"}
              size="lg"
              onPress={handleToggleAttendance}
              disabled={isToggling}
            >
              {isToggling ? "..." : isAttending ? t("events.cancel") : t("events.join")}
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
}
