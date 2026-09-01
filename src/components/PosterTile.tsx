import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

import { posterUrl } from "@/services/tmdb";

interface PosterTileProps {
  title: string;
  posterPath: string | null;
  subtitle?: string;
  onPress: () => void;
}

export function PosterTile({ title, posterPath, subtitle, onPress }: PosterTileProps) {
  return (
    <Pressable onPress={onPress} className="mr-3 w-28 active:opacity-80">
      <Image
        source={posterUrl(posterPath) ?? undefined}
        style={{ width: 112, height: 168 }}
        contentFit="cover"
        transition={150}
        className="rounded-xl bg-surface-alt"
      />
      <Text numberOfLines={2} className="mt-1.5 text-xs font-semibold text-text-primary">
        {title}
      </Text>
      {subtitle ? <Text className="text-[11px] text-text-secondary">{subtitle}</Text> : null}
    </Pressable>
  );
}
