import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { Button } from "../../components/ui/Button";
import { Colors, Shadows } from "../../constants/colors";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError(t("auth.errorEmptyFields"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn(email.trim(), password);

      if (result.error) {
        setError(result.error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)");
      }
    } catch (err) {
      setError(t("auth.errorLoginFailed"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 40,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo & Header */}
          <View className="items-center mb-10">
            <View
              className="w-20 h-20 rounded-2xl items-center justify-center mb-5"
              style={[
                { backgroundColor: Colors.brand[500] },
                Shadows.card,
              ]}
            >
              <Text className="text-white text-4xl">🏠</Text>
            </View>
            <Text
              className="text-foreground text-3xl font-black"
              style={{ letterSpacing: -1 }}
            >
              {t("auth.appName")}
            </Text>
            <Text className="text-muted-foreground text-base mt-1">
              {t("auth.subtitle")}
            </Text>
          </View>

          {/* Form Card */}
          <View
            className="bg-card rounded-2xl p-6 border border-border/60"
            style={Shadows.card}
          >
            {/* Error Message */}
            {error && (
              <View className="bg-error-bg rounded-xl px-4 py-3 mb-5 border-l-4 border-error">
                <Text className="text-error text-sm">{error}</Text>
              </View>
            )}

            {/* Email Input */}
            <View className="mb-5">
              <Text className="text-foreground/80 text-sm font-medium mb-2">
                {t("auth.email")}
              </Text>
              <View className="bg-input/10 rounded-xl border border-input">
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t("auth.emailPlaceholder")}
                  placeholderTextColor={Colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="px-4 py-3.5 text-foreground text-[15px]"
                  style={{ fontWeight: "500" }}
                />
              </View>
            </View>

            {/* Password Input */}
            <View className="mb-6">
              <Text className="text-foreground/80 text-sm font-medium mb-2">
                {t("auth.password")}
              </Text>
              <View className="bg-input/10 rounded-xl border border-input">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t("auth.passwordPlaceholder")}
                  placeholderTextColor={Colors.mutedForeground}
                  secureTextEntry
                  className="px-4 py-3.5 text-foreground text-[15px]"
                  style={{ fontWeight: "500" }}
                />
              </View>
            </View>

            {/* Login Button */}
            <Button onPress={handleLogin} isLoading={isLoading} size="xl">
              {t("auth.signIn")}
            </Button>

            {/* Forgot Password */}
            <Pressable className="mt-4 items-center py-2">
              <Text className="text-primary text-sm font-medium">
                {t("auth.forgotPassword")}
              </Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View className="items-center mt-8">
            <Text className="text-muted-foreground text-xs">
              {t("auth.residentsOnly")}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
