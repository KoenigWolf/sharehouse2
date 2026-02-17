import { useState, useCallback } from "react";
import { View, Text, TextInput, Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { logError } from "../../lib/utils/log-error";
import { BottomSheet } from "../ui/BottomSheet";
import { Colors } from "../../constants/colors";

interface ShareCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EXPIRATION_DAYS = 3;

export function ShareCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: ShareCreateModalProps) {
  const { t } = useI18n();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = async () => {
    if (!title.trim() || !user) return;

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Calculate expiration date (3 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + EXPIRATION_DAYS);

      const { error } = await supabase.from("share_items").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        expires_at: expiresAt.toISOString(),
        status: "available",
      });

      if (error) {
        logError(error, { fn: "ShareCreateModal.handleSubmit" });
        Alert.alert(t("common.error"), t("share.createError"));
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      logError(error, { fn: "ShareCreateModal.handleSubmit" });
      Alert.alert(t("common.error"), t("share.createError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = title.trim().length > 0 && !isSubmitting;

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={t("share.createTitle")}
      rightAction={{
        label: t("share.createButton"),
        onPress: handleSubmit,
        disabled: !canSubmit,
        isLoading: isSubmitting,
      }}
    >
      <View className="p-4 space-y-4">
        {/* Title */}
        <View>
          <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
            {t("share.titleLabel")} <Text className="text-error">*</Text>
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("share.titlePlaceholder")}
            placeholderTextColor={Colors.mutedForeground}
            maxLength={100}
            autoFocus
            className="bg-muted/50 border border-border/50 rounded-xl px-4 py-3 text-foreground text-base"
            style={{ fontWeight: "500" }}
          />
        </View>

        {/* Description */}
        <View>
          <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
            {t("share.descriptionLabel")}
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t("share.descriptionPlaceholder")}
            placeholderTextColor={Colors.mutedForeground}
            multiline
            numberOfLines={3}
            maxLength={300}
            textAlignVertical="top"
            className="bg-muted/50 border border-border/50 rounded-xl px-4 py-3 text-foreground text-base min-h-[80px]"
          />
          <Text className="text-xs text-muted-foreground mt-1 ml-1 text-right">
            {description.length}/300
          </Text>
        </View>

        {/* Info */}
        <View className="bg-brand-50 rounded-xl p-4 mt-4">
          <View className="flex-row items-center">
            <Text className="text-lg mr-2">⏰</Text>
            <View className="flex-1">
              <Text className="text-brand-700 font-semibold text-sm">
                {t("share.expirationInfo")}
              </Text>
              <Text className="text-brand-600 text-xs mt-0.5">
                {t("share.expirationHint", { days: EXPIRATION_DAYS })}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}
