import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { PosterTile } from "@/components/PosterTile";
import { useWatchlist } from "@/context/WatchlistContext";
import { getRecommendations, getTrending, shuffle } from "@/services/tmdb";
import type { TMDBSearchResult, WatchlistItem } from "@/types";

const SCREEN_PADDING = 16;
const TILE_GAP = 12;
const MIN_TILE_WIDTH = 100;
// Sources come from the top 3% best-rated watched titles, not a fixed
// count — clamped between 1 (so it still works with a small list) and 15
// (so a huge list doesn't fire off dozens of parallel TMDB calls).
const RECOMMENDATION_SOURCE_PERCENTILE = 0.03;
const RECOMMENDATION_SOURCE_MAX = 15;
const RECOMMENDATION_COUNT = 9;

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

function pickRecommendationSources(items: WatchlistItem[]): WatchlistItem[] {
  const rated = [...items]
    .filter((item) => item.status === "watched" && item.rating > 0)
    .sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      const dateA = new Date(a.watchedAt ?? a.addedAt).getTime();
      const dateB = new Date(b.watchedAt ?? b.addedAt).getTime();
      return dateB - dateA;
    });

  if (rated.length === 0) return [];

  const count = Math.min(
    RECOMMENDATION_SOURCE_MAX,
    Math.max(1, Math.ceil(rated.length * RECOMMENDATION_SOURCE_PERCENTILE))
  );
  return rated.slice(0, count);
}

export default function DiscoverScreen() {
  const { items } = useWatchlist();
  const [trending, setTrending] = useState<TMDBSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recommended, setRecommended] = useState<TMDBSearchResult[]>([]);
  const { width } = useWindowDimensions();

  const numColumns = Math.max(
    3,
    Math.floor((width - SCREEN_PADDING * 2 + TILE_GAP) / (MIN_TILE_WIDTH + TILE_GAP))
  );
  const tileWidth =
    (width - SCREEN_PADDING * 2 - TILE_GAP * (numColumns - 1)) / numColumns;

  useEffect(() => {
    getTrending()
      .then(setTrending)
      .catch(() => setTrending([]))
      .finally(() => setIsLoading(false));
  }, []);

  const sourceItems = useMemo(() => pickRecommendationSources(items), [items]);
  const sourceKey = sourceItems.map((item) => `${item.mediaType}-${item.id}`).join(",");

  useEffect(() => {
    if (sourceItems.length === 0) {
      setRecommended([]);
      return;
    }
    let cancelled = false;
    Promise.all(
      sourceItems.map((item) => getRecommendations(item.mediaType, item.id).catch(() => []))
    ).then((lists) => {
      if (cancelled) return;
      const alreadyInList = new Set(items.map((item) => `${item.mediaType}-${item.id}`));
      const seen = new Set<string>();
      const combined = lists.flat().filter((rec) => {
        const key = `${rec.media_type}-${rec.id}`;
        if (alreadyInList.has(key) || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setRecommended(shuffle(combined).slice(0, RECOMMENDATION_COUNT));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey]);

  const discoverItems = useMemo(() => {
    const alreadyInList = new Set(items.map((item) => `${item.mediaType}-${item.id}`));
    return trending.filter((item) => !alreadyInList.has(`${item.media_type}-${item.id}`));
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
      ) : discoverItems.length === 0 && recommended.length === 0 ? (
        <EmptyState
          icon="compass-outline"
          title="Rien à découvrir"
          message="Reviens plus tard pour de nouvelles suggestions."
        />
      ) : (
        <FlatList
          key={numColumns}
          data={discoverItems}
          numColumns={numColumns}
          keyExtractor={(item) => `${item.media_type}-${item.id}`}
          removeClippedSubviews={false}
          contentContainerStyle={{ padding: SCREEN_PADDING }}
          columnWrapperStyle={{ gap: TILE_GAP, marginBottom: 16 }}
          ListHeaderComponent={
            recommended.length > 0 ? (
              <View className="mb-6">
                <Text className="mb-1 text-base font-semibold text-text-primary">
                  Recommandé pour toi
                </Text>
                <Text className="mb-3 text-xs text-text-secondary">
                  D'après tes films et séries les mieux notés
                </Text>
                {chunk(recommended, numColumns).map((row, rowIndex) => (
                  <View
                    key={rowIndex}
                    className="flex-row"
                    style={{ gap: TILE_GAP, marginBottom: 16 }}
                  >
                    {row.map((item) => (
                      <PosterTile
                        key={`${item.media_type}-${item.id}`}
                        title={item.title ?? item.name ?? "Sans titre"}
                        posterPath={item.poster_path}
                        subtitle={(item.release_date ?? item.first_air_date)?.slice(0, 4)}
                        onPress={() => router.push(`/details/${item.media_type}/${item.id}`)}
                        width={tileWidth}
                      />
                    ))}
                  </View>
                ))}
                {discoverItems.length > 0 ? (
                  <Text className="mb-3 mt-6 text-base font-semibold text-text-primary">
                    Tendances
                  </Text>
                ) : null}
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <PosterTile
              title={item.title ?? item.name ?? "Sans titre"}
              posterPath={item.poster_path}
              subtitle={(item.release_date ?? item.first_air_date)?.slice(0, 4)}
              onPress={() => router.push(`/details/${item.media_type}/${item.id}`)}
              width={tileWidth}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
