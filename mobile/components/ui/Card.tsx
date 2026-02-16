import { View, Pressable, type ViewProps, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { Shadows } from "../../constants/colors";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "default" | "elevated" | "outline";
  className?: string;
}

export function Card({
  children,
  onPress,
  variant = "default",
  className = "",
  style,
  ...props
}: CardProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const variantClasses = {
    default: "bg-card border border-border/60",
    elevated: "bg-card",
    outline: "bg-transparent border border-border",
  };

  const shadowStyle = variant === "elevated" ? Shadows.elevated : Shadows.card;

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        style={[shadowStyle, style]}
        className={`rounded-2xl overflow-hidden active:scale-[0.98] ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      style={[shadowStyle, style]}
      className={`rounded-2xl overflow-hidden ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}

// Card sub-components for structured layouts
export function CardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <View className={`px-4 pt-4 ${className}`}>{children}</View>;
}

export function CardContent({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <View className={`px-4 ${className}`}>{children}</View>;
}

export function CardFooter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <View className={`px-4 pb-4 ${className}`}>{children}</View>;
}
