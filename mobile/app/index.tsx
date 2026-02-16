import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../lib/auth";
import { Colors } from "../constants/colors";

/**
 * Root index - redirects based on auth state
 */
export default function Index() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <View className="w-16 h-16 bg-brand-500 rounded-2xl items-center justify-center mb-4">
          <Text className="text-white text-3xl">🏠</Text>
        </View>
        <ActivityIndicator color={Colors.brand[500]} size="small" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)" />;
}
