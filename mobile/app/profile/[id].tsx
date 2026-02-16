import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { supabase, type Profile } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { Avatar } from "../../components/ui/Avatar";
import { Card } from "../../components/ui/Card";
import { Colors } from "../../constants/colors";

const HEADER_HEIGHT = 280;

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile: currentProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setProfile(data);
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [id]);

  const isOwnProfile = currentProfile?.id === id;

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted-foreground">Loading...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted-foreground">Profile not found</Text>
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
              className="w-10 h-10 rounded-full bg-black/30 items-center justify-center"
            >
              <Text className="text-white text-lg">←</Text>
            </Pressable>
          ),
          headerRight: isOwnProfile
            ? () => (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/profile/${id}/edit`);
                  }}
                  className="w-10 h-10 rounded-full bg-black/30 items-center justify-center"
                >
                  <Text className="text-white text-lg">✏️</Text>
                </Pressable>
              )
            : undefined,
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {/* Cover Image */}
        <View>
          {profile.cover_url ? (
            <Image
              source={{ uri: profile.cover_url }}
              style={{ width: "100%", height: HEADER_HEIGHT }}
              contentFit="cover"
            />
          ) : (
            <View
              className="w-full"
              style={{ height: HEADER_HEIGHT, backgroundColor: Colors.brand[400] }}
            />
          )}
          <View className="absolute inset-0 bg-black/20" />
        </View>

        {/* Avatar */}
        <View className="items-center -mt-16 z-10">
          <View className="border-4 border-background rounded-full">
            <Avatar src={profile.avatar_url} name={profile.name} size={120} />
          </View>
        </View>

        {/* Profile Info */}
        <View className="px-4 -mt-4">
          {/* Name & Room */}
          <View className="items-center mt-4">
            <Text className="text-foreground text-2xl font-bold">
              {profile.nickname ?? profile.name}
            </Text>
            {profile.nickname && (
              <Text className="text-muted-foreground">{profile.name}</Text>
            )}
            {profile.room_number && (
              <View className="bg-brand-50 rounded-full px-3 py-1 mt-2">
                <Text className="text-brand-600 font-medium">
                  Room {profile.room_number}
                </Text>
              </View>
            )}
          </View>

          {/* MBTI & Tags */}
          {(profile.mbti || profile.hobbies?.length) && (
            <View className="flex-row flex-wrap justify-center gap-2 mt-4">
              {profile.mbti && (
                <View className="bg-muted rounded-full px-3 py-1">
                  <Text className="text-foreground text-sm font-medium">
                    {profile.mbti}
                  </Text>
                </View>
              )}
              {profile.hobbies?.slice(0, 3).map((hobby, i) => (
                <View key={i} className="bg-muted rounded-full px-3 py-1">
                  <Text className="text-foreground text-sm">{hobby}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Bio */}
          {profile.bio && (
            <View className="mt-6">
              <Card className="p-4">
                <Text className="text-foreground leading-6">{profile.bio}</Text>
              </Card>
            </View>
          )}

          {/* Details */}
          <View className="mt-6">
            <Card className="p-4">
              {profile.occupation && (
                <DetailRow icon="💼" label="Work" value={profile.occupation} />
              )}
              {profile.lifestyle && (
                <DetailRow icon="🌙" label="Lifestyle" value={profile.lifestyle} />
              )}
              {profile.move_in_date && (
                <DetailRow
                  icon="📅"
                  label="Moved in"
                  value={new Date(profile.move_in_date).toLocaleDateString(
                    "en-US",
                    { month: "long", year: "numeric" }
                  )}
                />
              )}
            </Card>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center py-2">
      <Text className="text-lg mr-3">{icon}</Text>
      <View>
        <Text className="text-muted-foreground text-xs">{label}</Text>
        <Text className="text-foreground">{value}</Text>
      </View>
    </View>
  );
}
