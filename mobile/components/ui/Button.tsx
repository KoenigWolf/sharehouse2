import { Text, Pressable, ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";
import { Colors } from "../../constants/colors";

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Button({
  children,
  onPress,
  variant = "primary",
  size = "md",
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

  const variantStyles = {
    primary: "bg-brand-500",
    secondary: "bg-muted border border-border",
    ghost: "bg-transparent",
  };

  const textStyles = {
    primary: "text-white",
    secondary: "text-foreground",
    ghost: "text-brand-500",
  };

  const sizeStyles = {
    sm: "px-3 py-2",
    md: "px-4 py-3",
    lg: "px-6 py-4",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || isLoading}
      className={`
        rounded-xl items-center justify-center flex-row active:opacity-80
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled ? "opacity-50" : ""}
        ${className}
      `}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === "primary" ? "white" : Colors.brand[500]}
          size="small"
        />
      ) : (
        <Text
          className={`font-semibold ${textStyles[variant]} ${textSizes[size]}`}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}
