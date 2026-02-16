import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../lib/auth";
import { Avatar } from "../../components/ui/Avatar";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await signOut();
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
        <Text className="text-3xl font-bold text-foreground">Settings</Text>
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
            onPress={() => router.push(`/profile/${profile?.id}`)}
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
                    ? `Room ${profile.room_number}`
                    : "No room assigned"}
                </Text>
                <Text className="text-brand-500 text-sm mt-1">
                  View Profile →
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Settings Sections */}
        <View className="mt-6">
          <Text className="text-muted-foreground text-sm font-semibold uppercase tracking-wider mb-3 px-2">
            Account
          </Text>
          <Card>
            <SettingsRow
              icon="✏️"
              label="Edit Profile"
              onPress={() => router.push(`/profile/${profile?.id}/edit`)}
            />
            <Divider />
            <SettingsRow
              icon="🔔"
              label="Notifications"
              onPress={() => {}}
            />
            <Divider />
            <SettingsRow
              icon="🌐"
              label="Language"
              value="English"
              onPress={() => {}}
            />
          </Card>
        </View>

        <View className="mt-6">
          <Text className="text-muted-foreground text-sm font-semibold uppercase tracking-wider mb-3 px-2">
            About
          </Text>
          <Card>
            <SettingsRow icon="📋" label="Terms of Service" onPress={() => {}} />
            <Divider />
            <SettingsRow icon="🔒" label="Privacy Policy" onPress={() => {}} />
            <Divider />
            <SettingsRow
              icon="ℹ️"
              label="Version"
              value="1.0.0"
              onPress={() => {}}
              showArrow={false}
            />
          </Card>
        </View>

        {/* Sign Out */}
        <View className="mt-8">
          <Button variant="ghost" onPress={handleSignOut}>
            <Text className="text-error font-semibold">Sign Out</Text>
          </Button>
        </View>

        {/* Footer */}
        <View className="items-center mt-8">
          <Text className="text-muted-foreground text-xs">
            Share House Portal
          </Text>
          <Text className="text-muted-foreground/50 text-xs mt-1">
            Made with ❤️ for housemates
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
