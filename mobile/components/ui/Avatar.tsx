import { View, Text } from "react-native";
import { Image } from "expo-image";
import { Colors } from "../../constants/colors";

interface AvatarProps {
  src: string | null | undefined;
  name: string;
  size?: number;
  showRing?: boolean;
  ringColor?: string;
  className?: string;
}

export function Avatar({
  src,
  name,
  size = 48,
  showRing = false,
  ringColor = Colors.card,
  className = "",
}: AvatarProps) {
  // Safely compute initials from name
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .map((segment) => segment[0] ?? "")
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  const ringStyle = showRing
    ? {
        borderWidth: size > 60 ? 4 : 2,
        borderColor: ringColor,
      }
    : undefined;

  if (!src) {
    return (
      <View
        className={`items-center justify-center rounded-full bg-secondary ${className}`}
        style={[{ width: size, height: size }, ringStyle]}
      >
        <Text
          style={{
            fontSize: size * 0.38,
            fontWeight: "600",
            color: Colors.mutedForeground,
            letterSpacing: -0.5,
          }}
        >
          {initials}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[{ width: size, height: size }, ringStyle]}
      className={`rounded-full overflow-hidden bg-secondary ${className}`}
    >
      <Image
        source={{ uri: src }}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
        transition={200}
        placeholder={"|L9H,DRi~Vof-:RjM{of~qj[ayay"}
        placeholderContentFit="cover"
      />
    </View>
  );
}

// Avatar group component for showing multiple avatars
export function AvatarGroup({
  avatars,
  max = 4,
  size = 32,
}: {
  avatars: Array<{ src?: string | null; name: string }>;
  max?: number;
  size?: number;
}) {
  const visibleAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <View className="flex-row items-center">
      {visibleAvatars.map((avatar, index) => (
        <View
          key={index}
          style={{
            marginLeft: index > 0 ? -size * 0.3 : 0,
            zIndex: visibleAvatars.length - index,
          }}
        >
          <Avatar
            src={avatar.src}
            name={avatar.name}
            size={size}
            showRing
            ringColor={Colors.card}
          />
        </View>
      ))}
      {remaining > 0 && (
        <View
          style={{
            marginLeft: -size * 0.3,
            width: size,
            height: size,
            borderWidth: 2,
            borderColor: Colors.card,
          }}
          className="rounded-full bg-secondary items-center justify-center"
        >
          <Text
            style={{
              fontSize: size * 0.35,
              fontWeight: "600",
              color: Colors.mutedForeground,
            }}
          >
            +{remaining}
          </Text>
        </View>
      )}
    </View>
  );
}
