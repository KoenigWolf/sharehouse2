import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useI18n } from "../../lib/i18n";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  // TODO: Implement event detail view
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
        }}
      />
      <View
        className="flex-1 items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-4xl mb-4">📅</Text>
        <Text className="text-foreground text-xl font-bold">
          {t("events.title")}
        </Text>
        <Text className="text-muted-foreground mt-2">Event ID: {id}</Text>
      </View>
    </View>
  );
}
