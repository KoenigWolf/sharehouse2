import { View, Text } from "react-native";
import { Image } from "expo-image";
import { Colors } from "../../constants/colors";

interface AvatarProps {
  src: string | null | undefined;
  name: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, name, size = 48, className = "" }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (!src) {
    return (
      <View
        className={`items-center justify-center rounded-full bg-brand-100 ${className}`}
        style={{ width: size, height: size }}
      >
        <Text
          style={{
            fontSize: size * 0.4,
            fontWeight: "600",
            color: Colors.brand[600],
          }}
        >
          {initials}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{ width: size, height: size }}
      className={`rounded-full overflow-hidden ${className}`}
    >
      <Image
        source={{ uri: src }}
        style={{ width: size, height: size }}
        contentFit="cover"
        transition={200}
        placeholder={"|L9H,DRi~Vof-:RjM{of~qj[ayay"}
        placeholderContentFit="cover"
      />
    </View>
  );
}
