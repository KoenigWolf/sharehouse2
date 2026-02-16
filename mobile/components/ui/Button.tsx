import { Text, Pressable, ActivityIndicator } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  children,
  onPress,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  className = "",
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.96, { damping: 20, stiffness: 400 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 400 });
  };

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
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || isLoading}
      style={animatedStyle}
      className={`
        rounded-xl items-center justify-center flex-row
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
    </AnimatedPressable>
  );
}
