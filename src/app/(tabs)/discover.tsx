import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { PosterTile } from "@/components/PosterTile";
import { useWatchlist } from "@/context/WatchlistContext";
import { getTrending } from "@/services/tmdb";
import type { TMDBSearchResult } from "@/types";

export default function DiscoverScreen() {
  const { items } = useWatchlist();
  const [trending, setTrending] = useState<TMDBSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getTrending()
      .then(setTrending)
      .catch(() => setTrending([]))
      .finally(() => setIsLoading(false));
  }, []);

  const discoverItems = useMemo(() => {
    const seenOrInProgress = new Set(
      items
        .filter((item) => item.status === "watched" || item.status === "watching")
        .map((item) => `${item.mediaType}-${item.id}`)
    );
    return trending.filter((item) => !seenOrInProgress.has(`${item.media_type}-${item.id}`));
  }, [trending, items]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <View className="px-4 pb-2 pt-4">
        <Text className="text-2xl font-bold text-text-primary">À découvrir</Text>
        <Text className="text-sm text-text-secondary">
          Films et séries tendance à ajouter à ta liste
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#E63946" />
        </View>
      ) : discoverItems.length === 0 ? (
        <EmptyState
          icon="compass-outline"
          title="Rien à découvrir"
          message="Reviens plus tard pour de nouvelles suggestions."
        />
      ) : (
        <FlatList
          data={discoverItems}
          numColumns={3}
          keyExtractor={(item) => `${item.media_type}-${item.id}`}
          removeClippedSubviews={false}
          contentContainerStyle={{ padding: 16 }}
          columnWrapperStyle={{ marginBottom: 16 }}
          renderItem={({ item }) => (
            <PosterTile
              title={item.title ?? item.name ?? "Sans titre"}
              posterPath={item.poster_path}
              subtitle={(item.release_date ?? item.first_air_date)?.slice(0, 4)}
              onPress={() => router.push(`/details/${item.media_type}/${item.id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
