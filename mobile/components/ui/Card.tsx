import { View, Pressable, type ViewProps } from "react-native";
import * as Haptics from "expo-haptics";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
}

export function Card({ children, onPress, className = "", style, ...props }: CardProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        style={style}
        className={`bg-card rounded-2xl border border-border/60 overflow-hidden active:opacity-90 ${className}`}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      style={style}
      className={`bg-card rounded-2xl border border-border/60 overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
