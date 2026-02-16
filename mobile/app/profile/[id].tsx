import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { supabase, type Profile } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { logError } from "../../lib/utils/log-error";
import { Avatar } from "../../components/ui/Avatar";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Colors, Shadows } from "../../constants/colors";

const HEADER_HEIGHT = 280;

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile: currentProfile } = useAuth();
  const { t } = useI18n();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          logError(error, { fn: "fetchProfile", id });
          return;
        }

        if (data) {
          setProfile(data);
        }
      } catch (error) {
        logError(error, { fn: "fetchProfile", id });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const isOwnProfile = currentProfile?.id === id;

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted-foreground">{t("common.loading")}</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted-foreground">{t("profile.notFound")}</Text>
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
              className="w-10 h-10 rounded-full bg-black/40 items-center justify-center backdrop-blur-sm"
              style={Shadows.sm}
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
                  className="w-10 h-10 rounded-full bg-black/40 items-center justify-center backdrop-blur-sm"
                  style={Shadows.sm}
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
            <Text
              className="text-foreground text-2xl font-bold"
              style={{ letterSpacing: -0.5 }}
            >
              {profile.nickname ?? profile.name}
            </Text>
            {profile.nickname && (
              <Text className="text-muted-foreground mt-0.5">{profile.name}</Text>
            )}
            {profile.room_number && (
              <View className="mt-3">
                <Badge variant="primary">
                  {t("common.room")} {profile.room_number}
                </Badge>
              </View>
            )}
          </View>

          {/* MBTI & Tags */}
          {(profile.mbti || (profile.hobbies && profile.hobbies.length > 0)) && (
            <View className="flex-row flex-wrap justify-center gap-2 mt-4">
              {profile.mbti && (
                <Badge variant="secondary">{profile.mbti}</Badge>
              )}
              {profile.hobbies?.slice(0, 3).map((hobby, i) => (
                <Badge key={i} variant="outline">{hobby}</Badge>
              ))}
            </View>
          )}

          {/* Bio */}
          {profile.bio && (
            <View className="mt-6">
              <Card variant="elevated" className="p-5">
                <Text className="text-foreground leading-6">{profile.bio}</Text>
              </Card>
            </View>
          )}

          {/* Details */}
          <View className="mt-6">
            <Card variant="elevated" className="p-4">
              {profile.occupation && (
                <DetailRow icon="💼" label={t("profile.work")} value={profile.occupation} />
              )}
              {profile.lifestyle && (
                <DetailRow icon="🌙" label={t("profile.lifestyle")} value={profile.lifestyle} />
              )}
              {profile.move_in_date && (
                <DetailRow
                  icon="📅"
                  label={t("profile.movedIn")}
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
    <View className="flex-row items-center py-3">
      <View className="w-10 h-10 rounded-xl bg-secondary items-center justify-center mr-3">
        <Text className="text-lg">{icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          {label}
        </Text>
        <Text className="text-foreground font-medium mt-0.5">{value}</Text>
      </View>
    </View>
  );
}
