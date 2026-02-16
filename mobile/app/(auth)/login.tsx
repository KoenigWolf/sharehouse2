import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../lib/auth";
import { Button } from "../../components/ui/Button";
import { Colors } from "../../constants/colors";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await signIn(email.trim(), password);

    if (result.error) {
      setError(result.error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    }

    setIsLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <View
        className="flex-1 px-6 justify-center"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        {/* Logo */}
        <View className="items-center mb-12">
          <View className="w-20 h-20 bg-brand-500 rounded-2xl items-center justify-center mb-4">
            <Text className="text-white text-4xl">🏠</Text>
          </View>
          <Text className="text-foreground text-2xl font-bold">
            Share House
          </Text>
          <Text className="text-muted-foreground text-sm mt-1">
            Resident Portal
          </Text>
        </View>

        {/* Form */}
        <View>
          {/* Error Message */}
          {error && (
            <View className="bg-error/10 rounded-xl px-4 py-3 mb-4">
              <Text className="text-error text-sm text-center">{error}</Text>
            </View>
          )}

          {/* Email Input */}
          <View className="mb-4">
            <Text className="text-foreground text-sm font-medium mb-2 ml-1">
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor={Colors.mutedForeground}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className="bg-muted rounded-xl px-4 py-3.5 text-foreground text-base"
            />
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <Text className="text-foreground text-sm font-medium mb-2 ml-1">
              Password
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.mutedForeground}
              secureTextEntry
              className="bg-muted rounded-xl px-4 py-3.5 text-foreground text-base"
            />
          </View>

          {/* Login Button */}
          <Button onPress={handleLogin} isLoading={isLoading} size="lg">
            Sign In
          </Button>

          {/* Forgot Password */}
          <Pressable className="mt-4 items-center">
            <Text className="text-brand-500 text-sm">Forgot password?</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View
          className="absolute bottom-8 left-0 right-0 items-center"
          style={{ paddingBottom: insets.bottom }}
        >
          <Text className="text-muted-foreground text-xs">
            For house residents only
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
