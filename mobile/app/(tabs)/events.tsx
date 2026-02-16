import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, RefreshControl, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { supabase, type Event } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { Avatar } from "../../components/ui/Avatar";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Colors } from "../../constants/colors";
import { formatDate, formatTime } from "../../lib/utils";

export default function EventsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("*, profiles(*), attendees:event_attendees(user_id, profiles(*))")
      .gte("event_date", new Date().toISOString().split("T")[0])
      .order("event_date", { ascending: true });

    if (data) {
      setEvents(data as Event[]);
    }
    setIsLoading(false);
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

    if (isAttending) {
      await supabase
        .from("event_attendees")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", user.id);
    } else {
      await supabase.from("event_attendees").insert({
        event_id: eventId,
        user_id: user.id,
      });
    }

    await fetchEvents();
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
        />
      );
    },
    [user, router]
  );

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="px-4 pb-4 bg-background border-b border-border/40"
      >
        <Text className="text-3xl font-bold text-foreground">Events</Text>
        <Text className="text-muted-foreground text-sm mt-1">
          Upcoming house events
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
            <Text className="text-muted-foreground">No upcoming events</Text>
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
          className="w-14 h-14 rounded-full bg-brand-500 items-center justify-center shadow-lg"
        >
          <Text className="text-white text-2xl">+</Text>
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
}: {
  event: Event;
  isAttending: boolean;
  onAttend: () => void;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress}>
      {/* Cover Image */}
      {event.image_url && (
        <Image
          source={{ uri: event.image_url }}
          style={{ width: "100%", height: 160 }}
          contentFit="cover"
          transition={200}
        />
      )}

      <View className="p-4">
        {/* Date Badge */}
        <View className="flex-row items-center mb-3">
          <View className="bg-brand-50 rounded-lg px-3 py-1.5">
            <Text className="text-brand-600 font-bold text-sm">
              {formatDate(event.event_date)}
            </Text>
          </View>
          {event.event_time && (
            <Text className="text-muted-foreground ml-2">
              {formatTime(event.event_time)}
            </Text>
          )}
        </View>

        {/* Title */}
        <Text className="text-foreground text-lg font-bold mb-1">
          {event.title}
        </Text>

        {/* Location */}
        {event.location && (
          <Text className="text-muted-foreground text-sm mb-3">
            📍 {event.location}
          </Text>
        )}

        {/* Organizer & Attendees */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Avatar
              src={event.profiles.avatar_url}
              name={event.profiles.name}
              size={24}
            />
            <Text className="text-muted-foreground text-sm ml-2">
              by {event.profiles.nickname ?? event.profiles.name}
            </Text>
          </View>

          {/* Attendees Count */}
          <View className="flex-row items-center">
            <Text className="text-muted-foreground text-sm mr-2">
              {event.attendees?.length ?? 0} going
            </Text>
          </View>
        </View>

        {/* Attend Button */}
        <View className="mt-4">
          <Button
            variant={isAttending ? "secondary" : "primary"}
            size="sm"
            onPress={(e) => {
              e?.stopPropagation?.();
              onAttend();
            }}
          >
            {isAttending ? "Cancel" : "Join"}
          </Button>
        </View>
      </View>
    </Card>
  );
}
