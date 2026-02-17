import { useEffect, useState, useCallback, memo } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { supabase, type BulletinMessage } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { logError } from "../../lib/utils/log-error";
import { Avatar } from "../../components/ui/Avatar";
import { Colors, Shadows } from "../../constants/colors";
import { formatDistanceToNow } from "../../lib/utils";

export default function BulletinScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const [messages, setMessages] = useState<BulletinMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("bulletin_messages")
        .select("*, profiles(*)")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        logError(error, { fn: "fetchMessages" });
        return;
      }

      if (data) {
        setMessages(data as BulletinMessage[]);
      }
    } catch (error) {
      logError(error, { fn: "fetchMessages" });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch profile for a new message (realtime payload doesn't include joined data)
  const fetchMessageProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    return data;
  }, []);

  useEffect(() => {
    fetchMessages();

    // Real-time subscription with delta updates
    const channel = supabase
      .channel("bulletin_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bulletin_messages" },
        async (payload) => {
          const newRecord = payload.new as BulletinMessage;
          // Fetch profile for the new message
          const profileData = await fetchMessageProfile(newRecord.user_id);
          if (profileData) {
            const messageWithProfile = {
              ...newRecord,
              profiles: profileData,
            } as BulletinMessage;
            setMessages((prev) => [messageWithProfile, ...prev]);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "bulletin_messages" },
        (payload) => {
          const deletedId = payload.old.id as string;
          setMessages((prev) => prev.filter((m) => m.id !== deletedId));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bulletin_messages" },
        (payload) => {
          const updated = payload.new as BulletinMessage;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updated.id ? { ...m, message: updated.message } : m
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessageProfile]);

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

    try {
      const { error } = await supabase.from("bulletin_messages").insert({
        user_id: user.id,
        message: newMessage.trim(),
      });

      if (error) {
        logError(error, { fn: "handlePost" });
        return;
      }

      setNewMessage("");
      // Realtime subscription handles the state update
    } catch (error) {
      logError(error, { fn: "handlePost" });
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert(t("bulletin.deleteTitle"), t("bulletin.deleteMessage"), [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            try {
              const { error } = await supabase
                .from("bulletin_messages")
                .delete()
                .eq("id", id);

              if (error) {
                logError(error, { fn: "handleDelete", id });
                Alert.alert(t("common.error"), t("bulletin.deleteError"));
              }
              // Realtime subscription handles the state update
            } catch (error) {
              logError(error, { fn: "handleDelete", id });
              Alert.alert(t("common.error"), t("bulletin.deleteError"));
            }
          },
        },
      ]);
    },
    [t]
  );

  const renderItem = useCallback(
    ({ item }: { item: BulletinMessage }) => (
      <MessageCard
        message={item}
        isOwn={item.user_id === user?.id}
        onDelete={() => handleDelete(item.id)}
        deleteLabel={t("common.delete")}
      />
    ),
    [user, t, handleDelete]
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      {/* Header */}
      <View
        style={[{ paddingTop: insets.top + 8 }, Shadows.sm]}
        className="px-4 pb-4 bg-card border-b border-border/40"
      >
        <Text
          className="text-2xl font-bold text-foreground"
          style={{ letterSpacing: -0.5 }}
        >
          {t("bulletin.title")}
        </Text>
        <Text className="text-muted-foreground text-sm mt-1">
          {t("bulletin.subtitle")}
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
        ItemSeparatorComponent={ItemSeparator}
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
            <Text className="text-muted-foreground">{t("bulletin.empty")}</Text>
            <Text className="text-muted-foreground text-sm">
              {t("bulletin.emptySubtitle")}
            </Text>
          </View>
        }
        // Performance optimizations
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === "android"}
      />

      {/* Compose Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-card border-t border-border/60"
        style={[{ paddingBottom: insets.bottom + 8 }, Shadows.elevated]}
      >
        <View className="flex-row items-end gap-3 px-4 py-3">
          <Avatar src={profile?.avatar_url} name={profile?.name ?? ""} size={36} showRing />
          <View className="flex-1 bg-secondary rounded-xl px-4 py-3 border border-border/50">
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder={t("bulletin.placeholder")}
              placeholderTextColor={Colors.mutedForeground}
              className="text-foreground text-[15px]"
              style={{ fontWeight: "500" }}
              multiline
              maxLength={280}
            />
          </View>
          <Pressable
            onPress={handlePost}
            disabled={!newMessage.trim() || isPosting}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              newMessage.trim() ? "bg-brand-500" : "bg-muted"
            }`}
            style={newMessage.trim() ? Shadows.sm : undefined}
          >
            <Text
              className={`text-lg ${newMessage.trim() ? "text-white" : "text-muted-foreground"}`}
            >
              {isPosting ? "…" : "↑"}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// Memoized separator component for FlatList
const ItemSeparator = memo(() => <View style={{ height: 12 }} />);
ItemSeparator.displayName = "ItemSeparator";

const MessageCard = memo(function MessageCard({
  message,
  isOwn,
  onDelete,
  deleteLabel,
}: {
  message: BulletinMessage;
  isOwn: boolean;
  onDelete: () => void;
  deleteLabel: string;
}) {
  return (
    <View
      className="bg-card rounded-2xl p-4 border border-border/60"
      style={Shadows.card}
    >
      <View className="flex-row items-start gap-3">
        <Avatar
          src={message.profiles.avatar_url}
          name={message.profiles.name}
          size={40}
          showRing
        />
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text
              className="font-bold text-foreground"
              style={{ letterSpacing: -0.3 }}
            >
              {message.profiles.nickname ?? message.profiles.name}
            </Text>
            <Text className="text-muted-foreground text-xs">
              {formatDistanceToNow(new Date(message.created_at))}
            </Text>
          </View>
          <Text className="text-foreground mt-2 leading-6">
            {message.message}
          </Text>
          {isOwn && (
            <Pressable onPress={onDelete} className="mt-3 self-start">
              <Text className="text-error text-xs font-medium">{deleteLabel}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
});
