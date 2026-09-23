import { Image } from "expo-image";
import { Pressable, Text } from "react-native";
import Animated, { FadeOut, ZoomIn } from "react-native-reanimated";

import { posterUrl } from "@/services/tmdb";

interface PosterTileProps {
  title: string;
  posterPath: string | null;
  subtitle?: string;
  onPress: () => void;
  width?: number;
}

export function PosterTile({ title, posterPath, subtitle, onPress, width = 112 }: PosterTileProps) {
  return (
    <Animated.View
      entering={ZoomIn.duration(250)}
      exiting={FadeOut.duration(200)}
      style={{ width }}
    >
      <Pressable onPress={onPress} className="active:opacity-80">
        <Image
          source={posterUrl(posterPath) ?? undefined}
          style={{ width, height: width * 1.5 }}
          contentFit="cover"
          transition={150}
          className="rounded-xl bg-surface-alt"
        />
        <Text numberOfLines={2} className="mt-1.5 text-xs font-semibold text-text-primary">
          {title}
        </Text>
        {subtitle ? <Text className="text-[11px] text-text-secondary">{subtitle}</Text> : null}
      </Pressable>
    </Animated.View>
  );
}
