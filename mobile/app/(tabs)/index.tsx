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
import { Badge } from "../../components/ui/Badge";
import { Colors, Shadows } from "../../constants/colors";

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
        style={[{ paddingTop: insets.top + 8 }, Shadows.sm]}
        className="px-4 pb-4 bg-card border-b border-border/40"
      >
        <Text
          className="text-2xl font-bold text-foreground mb-4"
          style={{ letterSpacing: -0.5 }}
        >
          {t("residents.title")}
        </Text>

        {/* Search Bar */}
        <View
          className="flex-row items-center bg-secondary rounded-xl px-4 h-12 border border-border/50"
        >
          <Text className="text-muted-foreground mr-3">🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("residents.searchPlaceholder")}
            placeholderTextColor={Colors.mutedForeground}
            className="flex-1 text-foreground text-[15px]"
            style={{ fontWeight: "500" }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery("")}
              className="w-6 h-6 rounded-full bg-muted-foreground/20 items-center justify-center"
            >
              <Text className="text-muted-foreground text-xs">✕</Text>
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
          padding: 12,
          paddingBottom: insets.bottom + 80,
        }}
        columnWrapperStyle={{ gap: 12 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View className="items-center justify-center py-20">
              <Text className="text-muted-foreground">{t("common.loading")}</Text>
            </View>
          ) : (
            <View className="items-center justify-center py-20">
              <Text className="text-4xl mb-3">👥</Text>
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
      <Card onPress={onPress} className="p-4">
        {/* Avatar */}
        <View className="items-center mb-3 relative">
          <Avatar
            src={profile.avatar_url}
            name={profile.name}
            size={72}
          />
          {isCurrentUser && (
            <View className="absolute -top-1 -right-1">
              <Badge variant="primary" size="sm">
                {youLabel}
              </Badge>
            </View>
          )}
        </View>

        {/* Info */}
        <View className="items-center">
          <Text
            className="text-foreground font-bold text-base"
            style={{ letterSpacing: -0.3 }}
            numberOfLines={1}
          >
            {profile.nickname ?? profile.name}
          </Text>
          {profile.room_number && (
            <Text className="text-muted-foreground text-sm mt-0.5">
              {roomLabel} {profile.room_number}
            </Text>
          )}
          {profile.mbti && (
            <View className="mt-2">
              <Badge variant="default">
                {profile.mbti}
              </Badge>
            </View>
          )}
        </View>
      </Card>
    </View>
  );
}
