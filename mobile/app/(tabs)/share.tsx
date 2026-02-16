import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, RefreshControl, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { supabase, type ShareItem } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { Avatar } from "../../components/ui/Avatar";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Colors } from "../../constants/colors";

export default function ShareScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [items, setItems] = useState<ShareItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("share_items")
      .select("*, profiles(*)")
      .eq("status", "available")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (data) {
      setItems(data as ShareItem[]);
    }
    setIsLoading(false);
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await supabase
      .from("share_items")
      .update({
        status: "claimed",
        claimed_by: user.id,
      })
      .eq("id", itemId);

    await fetchItems();
  };

  const renderItem = useCallback(
    ({ item }: { item: ShareItem }) => (
      <View className="flex-1">
        <ShareItemCard
          item={item}
          isOwn={item.user_id === user?.id}
          onClaim={() => handleClaim(item.id)}
        />
      </View>
    ),
    [user]
  );

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="px-4 pb-4 bg-background border-b border-border/40"
      >
        <Text className="text-3xl font-bold text-foreground">Share Board</Text>
        <Text className="text-muted-foreground text-sm mt-1">
          Share items with housemates
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
            <Text className="text-muted-foreground">No items available</Text>
            <Text className="text-muted-foreground text-sm">
              Share something!
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
          className="w-14 h-14 rounded-full bg-brand-500 items-center justify-center shadow-lg"
        >
          <Text className="text-white text-2xl">+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ShareItemCard({
  item,
  isOwn,
  onClaim,
}: {
  item: ShareItem;
  isOwn: boolean;
  onClaim: () => void;
}) {
  const expiresAt = new Date(item.expires_at);
  const hoursLeft = Math.max(
    0,
    Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60))
  );

  return (
    <Card className="flex-1">
      {/* Image */}
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={{ width: "100%", aspectRatio: 1 }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View
          className="w-full bg-muted items-center justify-center"
          style={{ aspectRatio: 1 }}
        >
          <Text className="text-4xl">📦</Text>
        </View>
      )}

      <View className="p-3">
        {/* Title */}
        <Text
          className="text-foreground font-semibold"
          numberOfLines={2}
        >
          {item.title}
        </Text>

        {/* Expiry */}
        <Text className="text-muted-foreground text-xs mt-1">
          {hoursLeft > 0 ? `${hoursLeft}h left` : "Expires soon"}
        </Text>

        {/* Owner */}
        <View className="flex-row items-center mt-2">
          <Avatar
            src={item.profiles.avatar_url}
            name={item.profiles.name}
            size={20}
          />
          <Text className="text-muted-foreground text-xs ml-1.5" numberOfLines={1}>
            {item.profiles.nickname ?? item.profiles.name}
          </Text>
        </View>

        {/* Claim Button */}
        {!isOwn && (
          <View className="mt-3">
            <Button variant="primary" size="sm" onPress={onClaim}>
              Claim
            </Button>
          </View>
        )}
      </View>
    </Card>
  );
}
