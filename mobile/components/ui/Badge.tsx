import { View, Text } from "react-native";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "secondary" | "success" | "error" | "warning" | "outline";
  size?: "sm" | "default";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "default",
  className = "",
}: BadgeProps) {
  const variantStyles: Record<string, string> = {
    default: "bg-secondary",
    primary: "bg-primary",
    secondary: "bg-secondary",
    success: "bg-success-bg",
    error: "bg-error-bg",
    warning: "bg-warning-bg",
    outline: "bg-transparent border border-border",
  };

  const textStyles: Record<string, string> = {
    default: "text-secondary-foreground",
    primary: "text-primary-foreground",
    secondary: "text-secondary-foreground",
    success: "text-success",
    error: "text-error",
    warning: "text-warning",
    outline: "text-muted-foreground",
  };

  const sizeStyles = {
    sm: "px-1.5 py-0.5",
    default: "px-2 py-0.5",
  };

  const textSizes = {
    sm: "text-[9px]",
    default: "text-[10px]",
  };

  return (
    <View
      className={`rounded-md items-center justify-center ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      <Text
        className={`font-medium tracking-wide ${textStyles[variant]} ${textSizes[size]}`}
      >
        {children}
      </Text>
    </View>
  );
}
