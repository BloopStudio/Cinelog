import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

import { posterUrl } from "@/services/tmdb";

interface PersonCardProps {
  name: string;
  profilePath: string | null;
  onPress: () => void;
}

export function PersonCard({ name, profilePath, onPress }: PersonCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center gap-3 rounded-2xl bg-surface p-3 active:opacity-80"
    >
      <Image
        source={posterUrl(profilePath, "w185") ?? undefined}
        style={{ width: 56, height: 56, borderRadius: 28 }}
        contentFit="cover"
        className="bg-surface-alt"
      />
      <View className="flex-1">
        <Text numberOfLines={1} className="text-base font-semibold text-text-primary">
          {name}
        </Text>
        <Text className="text-sm text-text-secondary">Acteur / actrice</Text>
      </View>
    </Pressable>
  );
}
