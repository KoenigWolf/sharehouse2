import { Tabs } from "expo-router";
import { View, Text, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useI18n } from "../../lib/i18n";
import { Colors } from "../../constants/colors";

// Tab bar icons as simple components
function TabIcon({
  name,
  focused,
}: {
  name: "residents" | "bulletin" | "events" | "share" | "profile";
  focused: boolean;
}) {
  const iconMap = {
    residents: "👥",
    bulletin: "💬",
    events: "📅",
    share: "🎁",
    profile: "⚙️",
  };

  return (
    <View
      className={`items-center justify-center w-12 h-8 rounded-full ${
        focused ? "bg-primary/10" : ""
      }`}
    >
      <Text
        style={{
          fontSize: 20,
          opacity: focused ? 1 : 0.5,
        }}
      >
        {iconMap[name]}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  const handleTabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.mutedForeground,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.OS === "ios" ? "rgba(255,255,255,0.92)" : Colors.card,
          borderTopColor: Colors.border,
          borderTopWidth: 0.5,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 6,
          // Shadow for elevated appearance
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 0.2,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.residents"),
          tabBarIcon: ({ focused }) => (
            <TabIcon name="residents" focused={focused} />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="bulletin"
        options={{
          title: t("tabs.bulletin"),
          tabBarIcon: ({ focused }) => (
            <TabIcon name="bulletin" focused={focused} />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: t("tabs.events"),
          tabBarIcon: ({ focused }) => (
            <TabIcon name="events" focused={focused} />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="share"
        options={{
          title: t("tabs.share"),
          tabBarIcon: ({ focused }) => <TabIcon name="share" focused={focused} />,
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("tabs.settings"),
          tabBarIcon: ({ focused }) => (
            <TabIcon name="profile" focused={focused} />
          ),
        }}
        listeners={{
          tabPress: handleTabPress,
        }}
      />
    </Tabs>
  );
}
