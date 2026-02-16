import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Pressable,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { supabase, type Profile } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { logError } from "../../lib/utils/log-error";
import { Avatar } from "../../components/ui/Avatar";
import { Card } from "../../components/ui/Card";
import { Colors } from "../../constants/colors";

export default function ResidentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile: currentProfile } = useAuth();
  const { t } = useI18n();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("room_number", { ascending: true });

      if (error) {
        logError(error, { fn: "fetchProfiles" });
        return;
      }

      if (data) {
        setProfiles(data);
        setFilteredProfiles(data);
      }
    } catch (error) {
      logError(error, { fn: "fetchProfiles" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = profiles.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.nickname?.toLowerCase().includes(query) ||
          p.room_number?.toLowerCase().includes(query)
      );
      setFilteredProfiles(filtered);
    } else {
      setFilteredProfiles(profiles);
    }
  }, [searchQuery, profiles]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchProfiles();
    setIsRefreshing(false);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Profile }) => (
      <ResidentCard
        profile={item}
        onPress={() => router.push(`/profile/${item.id}`)}
        isCurrentUser={item.user_id === currentProfile?.user_id}
        youLabel={t("common.you")}
        roomLabel={t("common.room")}
      />
    ),
    [router, currentProfile, t]
  );

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="px-4 pb-4 bg-background border-b border-border/40"
      >
        <Text className="text-3xl font-bold text-foreground mb-4">
          {t("residents.title")}
        </Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-muted rounded-xl px-4 py-3">
          <Text className="text-muted-foreground mr-2">🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("residents.searchPlaceholder")}
            placeholderTextColor={Colors.mutedForeground}
            className="flex-1 text-foreground text-base"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Text className="text-muted-foreground text-lg">✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Profiles Grid */}
      <FlatList
        data={filteredProfiles}
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
          isLoading ? (
            <View className="items-center justify-center py-20">
              <Text className="text-muted-foreground">{t("common.loading")}</Text>
            </View>
          ) : (
            <View className="items-center justify-center py-20">
              <Text className="text-muted-foreground">{t("residents.empty")}</Text>
            </View>
          )
        }
      />
    </View>
  );
}

// Resident Card Component
function ResidentCard({
  profile,
  onPress,
  isCurrentUser,
  youLabel,
  roomLabel,
}: {
  profile: Profile;
  onPress: () => void;
  isCurrentUser: boolean;
  youLabel: string;
  roomLabel: string;
}) {
  return (
    <View className="flex-1">
      <Card onPress={onPress} className="p-3">
        {/* Avatar */}
        <View className="items-center mb-3">
          <Avatar
            src={profile.avatar_url}
            name={profile.name}
            size={80}
          />
          {isCurrentUser && (
            <View className="absolute -top-1 -right-1 bg-brand-500 rounded-full px-2 py-0.5">
              <Text className="text-white text-[10px] font-bold">{youLabel}</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View className="items-center">
          <Text
            className="text-foreground font-semibold text-base"
            numberOfLines={1}
          >
            {profile.nickname ?? profile.name}
          </Text>
          {profile.room_number && (
            <Text className="text-muted-foreground text-sm">
              {roomLabel} {profile.room_number}
            </Text>
          )}
          {profile.mbti && (
            <View className="bg-brand-50 rounded-full px-2 py-0.5 mt-1">
              <Text className="text-brand-600 text-xs font-medium">
                {profile.mbti}
              </Text>
            </View>
          )}
        </View>
      </Card>
    </View>
  );
}
