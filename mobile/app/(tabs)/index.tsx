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
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { supabase, type Profile } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { Avatar } from "../../components/ui/Avatar";
import { Card } from "../../components/ui/Card";
import { Colors } from "../../constants/colors";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Profile>);

export default function ResidentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile: currentProfile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const scrollY = useSharedValue(0);

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("room_number", { ascending: true });

    if (data) {
      setProfiles(data);
      setFilteredProfiles(data);
    }
    setIsLoading(false);
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

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 100], [1, 0.9]);
    const translateY = interpolate(scrollY.value, [0, 100], [0, -10]);
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const renderItem = useCallback(
    ({ item, index }: { item: Profile; index: number }) => (
      <Animated.View
        entering={FadeInDown.delay(index * 50)
          .duration(400)
          .springify()
          .damping(20)}
      >
        <ResidentCard
          profile={item}
          onPress={() => router.push(`/profile/${item.id}`)}
          isCurrentUser={item.user_id === currentProfile?.user_id}
        />
      </Animated.View>
    ),
    [router, currentProfile]
  );

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <Animated.View
        style={[headerStyle, { paddingTop: insets.top }]}
        className="px-4 pb-4 bg-background border-b border-border/40"
      >
        <Text className="text-3xl font-bold text-foreground mb-4">
          Residents
        </Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-muted rounded-xl px-4 py-3">
          <Text className="text-muted-foreground mr-2">🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name or room..."
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
      </Animated.View>

      {/* Profiles Grid */}
      <AnimatedFlatList
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
        onScroll={scrollHandler}
        scrollEventThrottle={16}
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
              <Text className="text-muted-foreground">Loading...</Text>
            </View>
          ) : (
            <View className="items-center justify-center py-20">
              <Text className="text-muted-foreground">No residents found</Text>
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
}: {
  profile: Profile;
  onPress: () => void;
  isCurrentUser: boolean;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle} className="flex-1">
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
              <Text className="text-white text-[10px] font-bold">YOU</Text>
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
              Room {profile.room_number}
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
    </Animated.View>
  );
}
