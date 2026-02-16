import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, RefreshControl, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { supabase, type Event } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { logError } from "../../lib/utils/log-error";
import { Avatar, AvatarGroup } from "../../components/ui/Avatar";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Colors, Shadows } from "../../constants/colors";
import { formatDate, formatTime } from "../../lib/utils";

export default function EventsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useI18n();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*, profiles(*), attendees:event_attendees(user_id, profiles(*))")
        .gte("event_date", new Date().toISOString().split("T")[0])
        .order("event_date", { ascending: true });

      if (error) {
        logError(error, { fn: "fetchEvents", query: "events" });
        return;
      }

      if (data) {
        setEvents(data as Event[]);
      }
    } catch (error) {
      logError(error, { fn: "fetchEvents" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchEvents();
    setIsRefreshing(false);
  }, []);

  const handleAttend = async (eventId: string, isAttending: boolean) => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (isAttending) {
        const { error } = await supabase
          .from("event_attendees")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user.id);

        if (error) {
          logError(error, { fn: "handleAttend", eventId, action: "delete" });
          return;
        }
      } else {
        const { error } = await supabase.from("event_attendees").insert({
          event_id: eventId,
          user_id: user.id,
        });

        if (error) {
          logError(error, { fn: "handleAttend", eventId, action: "insert" });
          return;
        }
      }

      await fetchEvents();
    } catch (error) {
      logError(error, { fn: "handleAttend", eventId });
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: Event }) => {
      const isAttending = item.attendees?.some((a) => a.user_id === user?.id);
      return (
        <EventCard
          event={item}
          isAttending={isAttending}
          onAttend={() => handleAttend(item.id, isAttending)}
          onPress={() => router.push(`/events/${item.id}`)}
          goingLabel={t("events.going")}
          joinLabel={t("events.join")}
          cancelLabel={t("events.cancel")}
          byLabel={t("events.by")}
        />
      );
    },
    [user, router, t]
  );

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        style={[{ paddingTop: insets.top + 8 }, Shadows.sm]}
        className="px-4 pb-4 bg-card border-b border-border/40"
      >
        <Text
          className="text-2xl font-bold text-foreground"
          style={{ letterSpacing: -0.5 }}
        >
          {t("events.title")}
        </Text>
        <Text className="text-muted-foreground text-sm mt-1">
          {t("events.subtitle")}
        </Text>
      </View>

      {/* Events List */}
      <FlatList
        data={events}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 100,
        }}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.brand[500]}
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-4xl mb-4">📅</Text>
            <Text className="text-muted-foreground">{t("events.empty")}</Text>
          </View>
        }
      />

      {/* FAB */}
      <View className="absolute bottom-24 right-4">
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            // TODO: Open create event modal
          }}
          className="w-14 h-14 rounded-full bg-brand-500 items-center justify-center"
          style={Shadows.elevated}
        >
          <Text className="text-white text-2xl font-light">+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function EventCard({
  event,
  isAttending,
  onAttend,
  onPress,
  goingLabel,
  joinLabel,
  cancelLabel,
  byLabel,
}: {
  event: Event;
  isAttending: boolean;
  onAttend: () => void;
  onPress: () => void;
  goingLabel: string;
  joinLabel: string;
  cancelLabel: string;
  byLabel: string;
}) {
  const attendeeAvatars = event.attendees?.slice(0, 5).map((a) => ({
    src: a.profiles?.avatar_url,
    name: a.profiles?.name ?? "",
  })) ?? [];

  return (
    <Card onPress={onPress} variant="elevated">
      {/* Cover Image */}
      {event.image_url && (
        <View className="overflow-hidden rounded-t-2xl">
          <Image
            source={{ uri: event.image_url }}
            style={{ width: "100%", height: 180 }}
            contentFit="cover"
            transition={200}
          />
        </View>
      )}

      <View className="p-4">
        {/* Date Badge */}
        <View className="flex-row items-center mb-3">
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
          className="text-foreground text-lg font-bold mb-1"
          style={{ letterSpacing: -0.3 }}
        >
          {event.title}
        </Text>

        {/* Location */}
        {event.location && (
          <Text className="text-muted-foreground text-sm mb-4">
            📍 {event.location}
          </Text>
        )}

        {/* Organizer */}
        <View className="flex-row items-center mb-4">
          <Avatar
            src={event.profiles.avatar_url}
            name={event.profiles.name}
            size={28}
            showRing
          />
          <Text className="text-muted-foreground text-sm ml-2">
            {byLabel} {event.profiles.nickname ?? event.profiles.name}
          </Text>
        </View>

        {/* Attendees */}
        <View className="flex-row items-center justify-between mb-4">
          {attendeeAvatars.length > 0 ? (
            <AvatarGroup avatars={attendeeAvatars} size={28} max={5} />
          ) : (
            <View />
          )}
          <Badge variant="outline">
            {event.attendees?.length ?? 0} {goingLabel}
          </Badge>
        </View>

        {/* Attend Button */}
        <Button
          variant={isAttending ? "secondary" : "default"}
          size="default"
          onPress={onAttend}
        >
          {isAttending ? cancelLabel : joinLabel}
        </Button>
      </View>
    </Card>
  );
}
