import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { supabase, type Profile } from "../../../lib/supabase";
import { useAuth } from "../../../lib/auth";
import { useI18n } from "../../../lib/i18n";
import { logError } from "../../../lib/utils/log-error";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Colors } from "../../../constants/colors";

const MBTI_TYPES = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

const LIFESTYLE_OPTIONS = [
  "earlyBird",
  "nightOwl",
  "flexible",
];

export default function ProfileEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { user, profile: authProfile, refreshProfile } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Form state
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [occupation, setOccupation] = useState("");
  const [mbti, setMbti] = useState<string | null>(null);
  const [lifestyle, setLifestyle] = useState<string | null>(null);
  const [hobbies, setHobbies] = useState("");
  const [showMbtiPicker, setShowMbtiPicker] = useState(false);

  // Check authorization
  const isAuthorized = user?.id === id || authProfile?.id === id;

  useEffect(() => {
    if (!id || !isAuthorized) {
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
          logError(error, { fn: "ProfileEdit.fetchProfile", id });
          return;
        }

        if (data) {
          setProfile(data);
          setNickname(data.nickname ?? "");
          setBio(data.bio ?? "");
          setOccupation(data.occupation ?? "");
          setMbti(data.mbti);
          setLifestyle(data.lifestyle);
          setHobbies(data.hobbies?.join(", ") ?? "");
        }
      } catch (error) {
        logError(error, { fn: "ProfileEdit.fetchProfile", id });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [id, isAuthorized]);

  const handleSave = useCallback(async () => {
    if (!profile || !user) return;

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const hobbiesArray = hobbies
        .split(",")
        .map((h) => h.trim())
        .filter((h) => h.length > 0);

      const { error } = await supabase
        .from("profiles")
        .update({
          nickname: nickname.trim() || null,
          bio: bio.trim() || null,
          occupation: occupation.trim() || null,
          mbti: mbti,
          lifestyle: lifestyle,
          hobbies: hobbiesArray.length > 0 ? hobbiesArray : null,
        })
        .eq("id", profile.id);

      if (error) {
        logError(error, { fn: "ProfileEdit.handleSave" });
        Alert.alert(t("common.error"), t("profile.saveError"));
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshProfile();
      router.back();
    } catch (error) {
      logError(error, { fn: "ProfileEdit.handleSave" });
      Alert.alert(t("common.error"), t("profile.saveError"));
    } finally {
      setIsSaving(false);
    }
  }, [profile, user, nickname, bio, occupation, mbti, lifestyle, hobbies, t, refreshProfile, router]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={Colors.brand[500]} />
      </View>
    );
  }

  if (!isAuthorized || !profile) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-4xl mb-4">🔒</Text>
        <Text className="text-foreground text-lg font-bold">
          {t("profile.unauthorized")}
        </Text>
        <Button
          variant="secondary"
          size="default"
          onPress={() => router.back()}
          className="mt-4"
        >
          {t("common.back")}
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t("profile.editTitle"),
          headerStyle: { backgroundColor: Colors.card },
          headerTitleStyle: { color: Colors.foreground, fontWeight: "700" },
          headerLeft: () => (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 rounded-full items-center justify-center"
            >
              <Text className="text-foreground text-lg">✕</Text>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              className="px-4 py-2 rounded-full bg-brand-500"
            >
              <Text className="text-white font-semibold text-sm">
                {isSaving ? "..." : t("common.save")}
              </Text>
            </Pressable>
          ),
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View className="items-center py-8 bg-card border-b border-border/40">
          <Avatar src={profile.avatar_url} name={profile.name} size={100} />
          <Text className="text-foreground font-bold text-lg mt-3">
            {profile.name}
          </Text>
          {profile.room_number && (
            <Badge variant="outline" className="mt-2">
              {t("common.room")} {profile.room_number}
            </Badge>
          )}
        </View>

        <View className="p-4 space-y-6">
          {/* Nickname */}
          <View>
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
              {t("profile.nicknameLabel")}
            </Text>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder={t("profile.nicknamePlaceholder")}
              placeholderTextColor={Colors.mutedForeground}
              maxLength={50}
              className="bg-muted/50 border border-border/50 rounded-xl px-4 py-3 text-foreground text-base"
            />
          </View>

          {/* Bio */}
          <View>
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
              {t("profile.bioLabel")}
            </Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder={t("profile.bioPlaceholder")}
              placeholderTextColor={Colors.mutedForeground}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
              className="bg-muted/50 border border-border/50 rounded-xl px-4 py-3 text-foreground text-base min-h-[100px]"
            />
            <Text className="text-xs text-muted-foreground mt-1 ml-1 text-right">
              {bio.length}/500
            </Text>
          </View>

          {/* Occupation */}
          <View>
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
              {t("profile.occupationLabel")}
            </Text>
            <View className="flex-row items-center bg-muted/50 border border-border/50 rounded-xl">
              <Text className="text-muted-foreground pl-4">💼</Text>
              <TextInput
                value={occupation}
                onChangeText={setOccupation}
                placeholder={t("profile.occupationPlaceholder")}
                placeholderTextColor={Colors.mutedForeground}
                maxLength={100}
                className="flex-1 px-2 py-3 text-foreground text-base"
              />
            </View>
          </View>

          {/* MBTI */}
          <View>
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
              MBTI
            </Text>
            <Pressable
              onPress={() => setShowMbtiPicker(!showMbtiPicker)}
              className="bg-muted/50 border border-border/50 rounded-xl px-4 py-3 flex-row items-center justify-between"
            >
              <Text className={mbti ? "text-foreground" : "text-muted-foreground"}>
                {mbti ?? t("profile.selectMbti")}
              </Text>
              <Text className="text-muted-foreground">{showMbtiPicker ? "▲" : "▼"}</Text>
            </Pressable>

            {showMbtiPicker && (
              <View className="flex-row flex-wrap gap-2 mt-3">
                {MBTI_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setMbti(mbti === type ? null : type);
                    }}
                    className={`px-3 py-2 rounded-lg ${
                      mbti === type ? "bg-brand-500" : "bg-muted"
                    }`}
                  >
                    <Text
                      className={`font-semibold text-sm ${
                        mbti === type ? "text-white" : "text-foreground"
                      }`}
                    >
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Lifestyle */}
          <View>
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
              {t("profile.lifestyleLabel")}
            </Text>
            <View className="flex-row gap-2">
              {LIFESTYLE_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLifestyle(lifestyle === option ? null : option);
                  }}
                  className={`flex-1 px-3 py-3 rounded-xl items-center ${
                    lifestyle === option ? "bg-brand-500" : "bg-muted/50 border border-border/50"
                  }`}
                >
                  <Text className="text-lg mb-1">
                    {option === "earlyBird" ? "🌅" : option === "nightOwl" ? "🌙" : "⚡"}
                  </Text>
                  <Text
                    className={`font-medium text-xs ${
                      lifestyle === option ? "text-white" : "text-foreground"
                    }`}
                  >
                    {option === "earlyBird"
                      ? t("profile.lifestyleEarlyBird")
                      : option === "nightOwl"
                        ? t("profile.lifestyleNightOwl")
                        : t("profile.lifestyleFlexible")}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Hobbies */}
          <View>
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
              {t("profile.hobbiesLabel")}
            </Text>
            <TextInput
              value={hobbies}
              onChangeText={setHobbies}
              placeholder={t("profile.hobbiesPlaceholder")}
              placeholderTextColor={Colors.mutedForeground}
              className="bg-muted/50 border border-border/50 rounded-xl px-4 py-3 text-foreground text-base"
            />
            <Text className="text-xs text-muted-foreground mt-1 ml-1">
              {t("profile.hobbiesHint")}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
