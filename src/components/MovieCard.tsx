import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

import { RatingStars } from "@/components/RatingStars";
import { StatusBadge } from "@/components/StatusBadge";
import { posterUrl } from "@/services/tmdb";
import type { WatchlistItem } from "@/types";

interface MovieCardProps {
  title: string;
  posterPath: string | null;
  subtitle?: string;
  status?: WatchlistItem["status"];
  rating?: number;
  onPress: () => void;
  onRemove?: () => void;
}

export function MovieCard({
  title,
  posterPath,
  subtitle,
  status,
  rating,
  onPress,
  onRemove,
}: MovieCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row overflow-hidden rounded-2xl bg-surface active:opacity-80"
    >
      <Image
        source={posterUrl(posterPath) ?? undefined}
        style={{ width: 84, height: 126 }}
        contentFit="cover"
        transition={150}
        className="bg-surface-alt"
      />
      <View className="flex-1 justify-between p-3">
        <View>
          <Text numberOfLines={2} className="text-base font-semibold text-text-primary">
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-0.5 text-sm text-text-secondary">{subtitle}</Text>
          ) : null}
        </View>

        <View className="flex-row items-center justify-between">
          <View className="gap-1.5">
            {status ? <StatusBadge status={status} /> : null}
            {rating ? <RatingStars rating={rating} size={14} /> : null}
          </View>
          {onRemove ? (
            <Pressable hitSlop={10} onPress={onRemove} className="p-1">
              <Ionicons name="trash-outline" size={18} color="#9AA5B1" />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
