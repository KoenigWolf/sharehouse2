import { useState, useCallback } from "react";
import { View, Text, TextInput, Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { useI18n } from "../../lib/i18n";
import { logError } from "../../lib/utils/log-error";
import { BottomSheet } from "../ui/BottomSheet";
import { Colors } from "../../constants/colors";

interface EventCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EventCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: EventCreateModalProps) {
  const { t } = useI18n();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setEventDate("");
    setEventTime("");
    setLocation("");
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = async () => {
    if (!title.trim() || !eventDate || !user) return;

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { error } = await supabase.from("events").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        event_date: eventDate,
        event_time: eventTime || null,
        location: location.trim() || null,
      });

      if (error) {
        logError(error, { fn: "EventCreateModal.handleSubmit" });
        Alert.alert(t("common.error"), t("events.createError"));
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      logError(error, { fn: "EventCreateModal.handleSubmit" });
      Alert.alert(t("common.error"), t("events.createError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = title.trim().length > 0 && eventDate.length > 0 && !isSubmitting;

  // Get today's date in YYYY-MM-DD format for date input
  const today = new Date().toISOString().split("T")[0];

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={t("events.createTitle")}
      rightAction={{
        label: t("events.createButton"),
        onPress: handleSubmit,
        disabled: !canSubmit,
        isLoading: isSubmitting,
      }}
    >
      <View className="p-4 space-y-4">
        {/* Title */}
        <View>
          <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
            {t("events.titleLabel")} <Text className="text-error">*</Text>
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("events.titlePlaceholder")}
            placeholderTextColor={Colors.mutedForeground}
            maxLength={100}
            autoFocus
            className="bg-muted/50 border border-border/50 rounded-xl px-4 py-3 text-foreground text-base"
            style={{ fontWeight: "500" }}
          />
        </View>

        {/* Date */}
        <View>
          <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
            {t("events.dateLabel")} <Text className="text-error">*</Text>
          </Text>
          <TextInput
            value={eventDate}
            onChangeText={setEventDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.mutedForeground}
            keyboardType="numbers-and-punctuation"
            className="bg-muted/50 border border-border/50 rounded-xl px-4 py-3 text-foreground text-base"
          />
          <Text className="text-xs text-muted-foreground mt-1 ml-1">
            {t("events.dateHint")} {today}
          </Text>
        </View>

        {/* Time */}
        <View>
          <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
            {t("events.timeLabel")}
          </Text>
          <TextInput
            value={eventTime}
            onChangeText={setEventTime}
            placeholder="HH:MM (e.g. 19:00)"
            placeholderTextColor={Colors.mutedForeground}
            keyboardType="numbers-and-punctuation"
            className="bg-muted/50 border border-border/50 rounded-xl px-4 py-3 text-foreground text-base"
          />
        </View>

        {/* Location */}
        <View>
          <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
            {t("events.locationLabel")}
          </Text>
          <View className="flex-row items-center bg-muted/50 border border-border/50 rounded-xl">
            <Text className="text-muted-foreground pl-4">📍</Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder={t("events.locationPlaceholder")}
              placeholderTextColor={Colors.mutedForeground}
              className="flex-1 px-2 py-3 text-foreground text-base"
            />
          </View>
        </View>

        {/* Description */}
        <View>
          <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
            {t("events.descriptionLabel")}
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t("events.descriptionPlaceholder")}
            placeholderTextColor={Colors.mutedForeground}
            multiline
            numberOfLines={3}
            maxLength={500}
            textAlignVertical="top"
            className="bg-muted/50 border border-border/50 rounded-xl px-4 py-3 text-foreground text-base min-h-[80px]"
          />
          <Text className="text-xs text-muted-foreground mt-1 ml-1 text-right">
            {description.length}/500
          </Text>
        </View>
      </View>
    </BottomSheet>
  );
}
