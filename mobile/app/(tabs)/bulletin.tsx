import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { supabase, type BulletinMessage } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { Colors } from "../../constants/colors";
import { formatDistanceToNow } from "../../lib/utils";

export default function BulletinScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<BulletinMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("bulletin_messages")
      .select("*, profiles(*)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setMessages(data as BulletinMessage[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMessages();

    // Real-time subscription
    const channel = supabase
      .channel("bulletin_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bulletin_messages" },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchMessages();
    setIsRefreshing(false);
  }, []);

  const handlePost = async () => {
    if (!newMessage.trim() || !user) return;

    setIsPosting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { error } = await supabase.from("bulletin_messages").insert({
      user_id: user.id,
      message: newMessage.trim(),
    });

    if (!error) {
      setNewMessage("");
      await fetchMessages();
    }

    setIsPosting(false);
  };

  const handleDelete = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await supabase.from("bulletin_messages").delete().eq("id", id);
    await fetchMessages();
  };

  const renderItem = useCallback(
    ({ item, index }: { item: BulletinMessage; index: number }) => (
      <Animated.View
        entering={FadeInDown.delay(index * 30)
          .duration(300)
          .springify()}
      >
        <MessageCard
          message={item}
          isOwn={item.user_id === user?.id}
          onDelete={() => handleDelete(item.id)}
        />
      </Animated.View>
    ),
    [user]
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="px-4 pb-4 bg-background border-b border-border/40"
      >
        <Text className="text-3xl font-bold text-foreground">Bulletin</Text>
        <Text className="text-muted-foreground text-sm mt-1">
          Share vibes with housemates
        </Text>
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 100,
        }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
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
            <Text className="text-4xl mb-4">💬</Text>
            <Text className="text-muted-foreground">No messages yet</Text>
            <Text className="text-muted-foreground text-sm">
              Be the first to post!
            </Text>
          </View>
        }
      />

      {/* Compose Bar */}
      <Animated.View
        entering={SlideInRight.duration(300)}
        className="absolute bottom-0 left-0 right-0 bg-card border-t border-border/40"
        style={{ paddingBottom: insets.bottom + 8 }}
      >
        <View className="flex-row items-end gap-3 px-4 py-3">
          <Avatar src={profile?.avatar_url} name={profile?.name ?? ""} size={36} />
          <View className="flex-1 bg-muted rounded-2xl px-4 py-2">
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="What's on your mind?"
              placeholderTextColor={Colors.mutedForeground}
              className="text-foreground text-base"
              multiline
              maxLength={280}
            />
          </View>
          <Pressable
            onPress={handlePost}
            disabled={!newMessage.trim() || isPosting}
            className={`p-2 rounded-full ${
              newMessage.trim() ? "bg-brand-500" : "bg-muted"
            }`}
          >
            <Text className={newMessage.trim() ? "text-white" : "text-muted-foreground"}>
              {isPosting ? "..." : "→"}
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

function MessageCard({
  message,
  isOwn,
  onDelete,
}: {
  message: BulletinMessage;
  isOwn: boolean;
  onDelete: () => void;
}) {
  return (
    <View className="bg-card rounded-2xl p-4 border border-border/40">
      <View className="flex-row items-start gap-3">
        <Avatar
          src={message.profiles.avatar_url}
          name={message.profiles.name}
          size={40}
        />
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-foreground">
              {message.profiles.nickname ?? message.profiles.name}
            </Text>
            <Text className="text-muted-foreground text-xs">
              {formatDistanceToNow(new Date(message.created_at))}
            </Text>
          </View>
          <Text className="text-foreground mt-1 leading-5">
            {message.message}
          </Text>
          {isOwn && (
            <Pressable onPress={onDelete} className="mt-2">
              <Text className="text-error text-xs">Delete</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
