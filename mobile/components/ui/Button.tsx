import { Text, Pressable, ActivityIndicator, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Colors, Shadows } from "../../constants/colors";

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "xs" | "sm" | "default" | "lg" | "xl" | "icon";
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Button({
  children,
  onPress,
  variant = "default",
  size = "default",
  isLoading = false,
  disabled = false,
  className = "",
}: ButtonProps) {
  const handlePress = () => {
    if (!disabled && !isLoading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress?.();
    }
  };

  const variantStyles: Record<string, string> = {
    default: "bg-primary",
    secondary: "bg-secondary",
    outline: "bg-transparent border border-border",
    ghost: "bg-transparent",
    destructive: "bg-error-bg border border-error/30",
  };

  const textStyles: Record<string, string> = {
    default: "text-primary-foreground",
    secondary: "text-secondary-foreground",
    outline: "text-foreground",
    ghost: "text-muted-foreground",
    destructive: "text-error",
  };

  const sizeStyles: Record<string, string> = {
    xs: "h-6 px-2.5",
    sm: "h-8 px-3",
    default: "h-9 px-4",
    lg: "h-10 px-5",
    xl: "h-12 px-6",
    icon: "h-9 w-9",
  };

  const textSizes: Record<string, string> = {
    xs: "text-[11px]",
    sm: "text-xs",
    default: "text-xs",
    lg: "text-xs",
    xl: "text-sm",
    icon: "text-sm",
  };

  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={variant === "default" ? Shadows.sm : undefined}
      className={`
        rounded-full items-center justify-center flex-row
        active:opacity-80
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${isDisabled ? "opacity-50" : ""}
        ${className}
      `}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === "default" ? "white" : Colors.primary}
          size="small"
        />
      ) : (
        <Text
          className={`font-semibold tracking-wide ${textStyles[variant]} ${textSizes[size]}`}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

// Icon button variant
export function IconButton({
  children,
  onPress,
  variant = "ghost",
  size = "default",
  disabled = false,
  className = "",
}: Omit<ButtonProps, "isLoading"> & { children: React.ReactNode }) {
  const handlePress = () => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress?.();
    }
  };

  const variantStyles: Record<string, string> = {
    default: "bg-primary",
    secondary: "bg-secondary",
    outline: "bg-transparent border border-border",
    ghost: "bg-transparent",
    destructive: "bg-error-bg",
  };

  const sizeStyles: Record<string, string> = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    default: "w-9 h-9",
    lg: "w-10 h-10",
    xl: "w-12 h-12",
    icon: "w-9 h-9",
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      className={`
        rounded-full items-center justify-center
        active:opacity-70
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled ? "opacity-50" : ""}
        ${className}
      `}
    >
      {children}
    </Pressable>
  );
}
