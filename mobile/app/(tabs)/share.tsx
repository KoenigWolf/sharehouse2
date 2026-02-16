import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, RefreshControl, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { supabase, type ShareItem } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { logError } from "../../lib/utils/log-error";
import { Avatar } from "../../components/ui/Avatar";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Colors, Shadows } from "../../constants/colors";

export default function ShareScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useI18n();
  const [items, setItems] = useState<ShareItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("share_items")
        .select("*, profiles(*)")
        .eq("status", "available")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) {
        logError(error, { fn: "fetchItems" });
        return;
      }

      if (data) {
        setItems(data as ShareItem[]);
      }
    } catch (error) {
      logError(error, { fn: "fetchItems" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchItems();
    setIsRefreshing(false);
  }, []);

  const handleClaim = async (itemId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("share_items")
        .update({
          status: "claimed",
          claimed_by: user.id,
        })
        .eq("id", itemId);

      if (error) {
        logError(error, { fn: "handleClaim", itemId });
        Alert.alert(t("common.error"), t("share.claimError"));
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await fetchItems();
    } catch (error) {
      logError(error, { fn: "handleClaim", itemId });
      Alert.alert(t("common.error"), t("share.claimError"));
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: ShareItem }) => (
      <View className="flex-1">
        <ShareItemCard
          item={item}
          isOwn={item.user_id === user?.id}
          onClaim={() => handleClaim(item.id)}
          claimLabel={t("share.claim")}
          hoursLeftLabel={(hours: number) =>
            hours > 0 ? t("share.hoursLeft", { hours }) : t("share.expiresSoon")
          }
        />
      </View>
    ),
    [user, t]
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
          {t("share.title")}
        </Text>
        <Text className="text-muted-foreground text-sm mt-1">
          {t("share.subtitle")}
        </Text>
      </View>

      {/* Items Grid */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{
          padding: 8,
          paddingBottom: insets.bottom + 100,
        }}
        columnWrapperStyle={{ gap: 8 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
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
            <Text className="text-4xl mb-4">🎁</Text>
            <Text className="text-muted-foreground">{t("share.empty")}</Text>
            <Text className="text-muted-foreground text-sm">
              {t("share.emptySubtitle")}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <View className="absolute bottom-24 right-4">
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            // TODO: Open create item modal
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

function ShareItemCard({
  item,
  isOwn,
  onClaim,
  claimLabel,
  hoursLeftLabel,
}: {
  item: ShareItem;
  isOwn: boolean;
  onClaim: () => void;
  claimLabel: string;
  hoursLeftLabel: (hours: number) => string;
}) {
  const expiresAt = new Date(item.expires_at);
  const hoursLeft = Math.max(
    0,
    Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60))
  );
  const isExpiringSoon = hoursLeft <= 6;

  return (
    <Card className="flex-1" variant="elevated">
      {/* Image */}
      <View className="overflow-hidden rounded-t-2xl">
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={{ width: "100%", aspectRatio: 1 }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View
            className="w-full bg-secondary items-center justify-center"
            style={{ aspectRatio: 1 }}
          >
            <Text className="text-4xl">📦</Text>
          </View>
        )}
      </View>

      <View className="p-3">
        {/* Title */}
        <Text
          className="text-foreground font-bold"
          style={{ letterSpacing: -0.3 }}
          numberOfLines={2}
        >
          {item.title}
        </Text>

        {/* Expiry Badge */}
        <View className="mt-2">
          <Badge variant={isExpiringSoon ? "warning" : "outline"} size="sm">
            {hoursLeftLabel(hoursLeft)}
          </Badge>
        </View>

        {/* Owner */}
        <View className="flex-row items-center mt-3">
          <Avatar
            src={item.profiles.avatar_url}
            name={item.profiles.name}
            size={22}
          />
          <Text
            className="text-muted-foreground text-xs ml-1.5 flex-1"
            numberOfLines={1}
          >
            {item.profiles.nickname ?? item.profiles.name}
          </Text>
        </View>

        {/* Claim Button */}
        {!isOwn && (
          <View className="mt-3">
            <Button variant="default" size="sm" onPress={onClaim}>
              {claimLabel}
            </Button>
          </View>
        )}
      </View>
    </Card>
  );
}
