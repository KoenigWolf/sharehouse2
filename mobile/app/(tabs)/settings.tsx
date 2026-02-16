import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { Avatar } from "../../components/ui/Avatar";
import { Card } from "../../components/ui/Card";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, signOut } = useAuth();
  const { t } = useI18n();

  const handleProfilePress = () => {
    if (!profile?.id) return;
    router.push(`/profile/${profile.id}`);
  };

  const handleEditProfilePress = () => {
    if (!profile?.id) return;
    router.push(`/profile/${profile.id}/edit`);
  };

  const handleSignOut = () => {
    Alert.alert(t("auth.signOutTitle"), t("auth.signOutMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("auth.signOut"),
        style: "destructive",
        onPress: async () => {
          await signOut();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="px-4 pb-4 bg-background border-b border-border/40"
      >
        <Text className="text-3xl font-bold text-foreground">{t("settings.title")}</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View>
          <Card
            onPress={handleProfilePress}
            className="p-4"
          >
            <View className="flex-row items-center">
              <Avatar
                src={profile?.avatar_url}
                name={profile?.name ?? ""}
                size={60}
              />
              <View className="ml-4 flex-1">
                <Text className="text-foreground text-lg font-bold">
                  {profile?.nickname ?? profile?.name}
                </Text>
                <Text className="text-muted-foreground text-sm">
                  {profile?.room_number
                    ? `${t("common.room")} ${profile.room_number}`
                    : t("settings.noRoom")}
                </Text>
                <Text className="text-brand-500 text-sm mt-1">
                  {t("settings.viewProfile")}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Settings Sections */}
        <View className="mt-6">
          <Text className="text-muted-foreground text-sm font-semibold uppercase tracking-wider mb-3 px-2">
            {t("settings.account")}
          </Text>
          <Card>
            <SettingsRow
              icon="✏️"
              label={t("settings.editProfile")}
              onPress={handleEditProfilePress}
            />
            <Divider />
            <SettingsRow
              icon="🔔"
              label={t("settings.notifications")}
              onPress={() => {}}
            />
            <Divider />
            <SettingsRow
              icon="🌐"
              label={t("settings.language")}
              value="English"
              onPress={() => {}}
            />
          </Card>
        </View>

        <View className="mt-6">
          <Text className="text-muted-foreground text-sm font-semibold uppercase tracking-wider mb-3 px-2">
            {t("settings.about")}
          </Text>
          <Card>
            <SettingsRow icon="📋" label={t("settings.termsOfService")} onPress={() => {}} />
            <Divider />
            <SettingsRow icon="🔒" label={t("settings.privacyPolicy")} onPress={() => {}} />
            <Divider />
            <SettingsRow
              icon="ℹ️"
              label={t("settings.version")}
              value="1.0.0"
              onPress={() => {}}
              showArrow={false}
            />
          </Card>
        </View>

        {/* Sign Out */}
        <View className="mt-8">
          <Pressable
            onPress={handleSignOut}
            className="items-center py-3 active:opacity-70"
          >
            <Text className="text-error font-semibold">{t("auth.signOut")}</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View className="items-center mt-8">
          <Text className="text-muted-foreground text-xs">
            {t("settings.footer")}
          </Text>
          <Text className="text-muted-foreground/50 text-xs mt-1">
            {t("settings.footerSubtitle")}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  showArrow = true,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress: () => void;
  showArrow?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      className="flex-row items-center justify-between px-4 py-3.5 active:bg-muted/50"
    >
      <View className="flex-row items-center">
        <Text className="text-lg mr-3">{icon}</Text>
        <Text className="text-foreground text-base">{label}</Text>
      </View>
      <View className="flex-row items-center">
        {value && (
          <Text className="text-muted-foreground text-sm mr-2">{value}</Text>
        )}
        {showArrow && <Text className="text-muted-foreground">›</Text>}
      </View>
    </Pressable>
  );
}

function Divider() {
  return <View className="h-px bg-border/40 mx-4" />;
}
