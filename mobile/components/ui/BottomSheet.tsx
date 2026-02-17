import { useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Shadows } from "../../constants/colors";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  rightAction?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
    isLoading?: boolean;
  };
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  rightAction,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  /* eslint-disable react-hooks/refs -- Animated.Value with useRef is the standard React Native pattern */
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  /* eslint-enable react-hooks/refs */

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/refs -- Animated.Value refs are stable and intentionally included
  }, [isOpen, slideAnim, fadeAnim]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Backdrop */}
        <Animated.View
          className="absolute inset-0 bg-black/50"
          style={{ opacity: fadeAnim }}
        >
          <Pressable className="flex-1" onPress={handleClose} />
        </Animated.View>

        {/* Sheet */}
        {/* eslint-disable react-hooks/refs -- Animated.Value is designed for render-time interpolation */}
        <Animated.View
          className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl"
          style={[
            Shadows.elevated,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [500, 0],
                  }),
                },
              ],
            },
          ]}
        >
        {/* eslint-enable react-hooks/refs */}
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 h-14 border-b border-border/40">
            <Pressable
              onPress={handleClose}
              className="w-10 h-10 rounded-full items-center justify-center active:bg-muted/50"
            >
              <Text className="text-foreground text-lg">✕</Text>
            </Pressable>

            <Text className="text-foreground font-bold text-sm">{title}</Text>

            {rightAction ? (
              <Pressable
                onPress={rightAction.onPress}
                disabled={rightAction.disabled || rightAction.isLoading}
                className={`px-4 h-8 rounded-full items-center justify-center ${
                  rightAction.disabled ? "bg-muted" : "bg-brand-500"
                }`}
              >
                <Text
                  className={`font-semibold text-xs ${
                    rightAction.disabled ? "text-muted-foreground" : "text-white"
                  }`}
                >
                  {rightAction.isLoading ? "..." : rightAction.label}
                </Text>
              </Pressable>
            ) : (
              <View className="w-10" />
            )}
          </View>

          {/* Content */}
          <ScrollView
            className="max-h-[70vh]"
            contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
