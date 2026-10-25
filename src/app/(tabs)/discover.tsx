import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { PosterTile } from "@/components/PosterTile";
import { SkeletonPosterTile } from "@/components/Skeleton";
import { useWatchlist } from "@/context/WatchlistContext";
import { getRecommendations, getTrending, shuffle } from "@/services/tmdb";
import type { MediaType, TMDBSearchResult, WatchlistItem } from "@/types";

const SCREEN_PADDING = 16;
const TILE_GAP = 12;
const MIN_TILE_WIDTH = 100;
// Sources come from the top 3% best-rated watched titles, not a fixed
// count — clamped between 1 (so it still works with a small list) and 15
// (so a huge list doesn't fire off dozens of parallel TMDB calls).
const RECOMMENDATION_SOURCE_PERCENTILE = 0.03;
const RECOMMENDATION_SOURCE_MAX = 15;
const RECOMMENDATION_COUNT = 9;

type MediaTypeFilter = "all" | MediaType;

const MEDIA_TYPE_FILTERS: { value: MediaTypeFilter; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "movie", label: "Films" },
  { value: "tv", label: "Séries" },
];

function interleave<T>(a: T[], b: T[]): T[] {
  const result: T[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (i < a.length) result.push(a[i]);
    if (i < b.length) result.push(b[i]);
  }
  return result;
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

function pickRecommendationSources(items: WatchlistItem[]): WatchlistItem[] {
  // Picked separately per media type (each with its own 1-item floor) so a
  // watchlist skewed toward one type still seeds enough of the other for
  // the recommendation pool to cover both — a single combined top-N would
  // often end up 100% movies (or 100% tv) whenever ratings lean that way.
  function topRated(mediaType: MediaType): WatchlistItem[] {
    const rated = items
      .filter(
        (item) => item.status === "watched" && item.rating > 0 && item.mediaType === mediaType
      )
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

  return [...topRated("movie"), ...topRated("tv")];
}

async function loadRecommendationPool(sourceItems: WatchlistItem[]): Promise<TMDBSearchResult[]> {
  if (sourceItems.length === 0) return [];
  const lists = await Promise.all(
    sourceItems.map((item) => getRecommendations(item.mediaType, item.id).catch(() => []))
  );
  const seen = new Set<string>();
  const combined = lists.flat().filter((rec) => {
    const key = `${rec.media_type}-${rec.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return shuffle(combined);
}

export default function DiscoverScreen() {
  const { items } = useWatchlist();
  const [trending, setTrending] = useState<{ movies: TMDBSearchResult[]; tv: TMDBSearchResult[] }>(
    { movies: [], tv: [] }
  );
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recommendedPool, setRecommendedPool] = useState<TMDBSearchResult[]>([]);
  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaTypeFilter>("all");
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
      .catch(() => setTrending({ movies: [], tv: [] }))
      .finally(() => setIsLoadingTrending(false));
  }, []);

  const sourceItems = useMemo(() => pickRecommendationSources(items), [items]);
  const sourceKey = sourceItems.map((item) => `${item.mediaType}-${item.id}`).join(",");

  useEffect(() => {
    let cancelled = false;
    loadRecommendationPool(sourceItems).then((pool) => {
      if (!cancelled) {
        setRecommendedPool(pool);
        setIsLoadingRecommendations(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceKey]);

  // Pull-to-refresh re-fetches both shelves — trending gets a fresh shuffled
  // page, recommendations get a fresh pool for the same source titles
  // (getRecommendations/shuffle differ run to run even with sourceKey
  // unchanged), instead of only reacting to the watchlist changing.
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [nextTrending, nextPool] = await Promise.all([
        getTrending().catch(() => trending),
        loadRecommendationPool(sourceItems),
      ]);
      setTrending(nextTrending);
      setRecommendedPool(nextPool);
    } finally {
      setIsRefreshing(false);
    }
  };

  const discoverItems = useMemo(() => {
    const alreadyInList = new Set(items.map((item) => `${item.mediaType}-${item.id}`));
    const pool =
      mediaTypeFilter === "movie"
        ? trending.movies
        : mediaTypeFilter === "tv"
          ? trending.tv
          : interleave(trending.movies, trending.tv);
    return pool.filter((item) => !alreadyInList.has(`${item.media_type}-${item.id}`));
  }, [trending, items, mediaTypeFilter]);

  // Pulled fresh from the pool (not re-shuffled) every time `items` changes,
  // so adding a recommended title to the list drops it here and the next
  // title in the pool takes its place instead of leaving a gap.
  const recommended = useMemo(() => {
    const alreadyInList = new Set(items.map((item) => `${item.mediaType}-${item.id}`));
    return recommendedPool
      .filter(
        (item) =>
          !alreadyInList.has(`${item.media_type}-${item.id}`) &&
          (mediaTypeFilter === "all" || item.media_type === mediaTypeFilter)
      )
      .slice(0, RECOMMENDATION_COUNT);
  }, [recommendedPool, items, mediaTypeFilter]);

  const renderSkeletonRows = (count: number) => (
    <>
      {chunk(Array.from({ length: count }, (_, i) => i), numColumns).map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row" style={{ gap: TILE_GAP, marginBottom: 16 }}>
          {row.map((i) => (
            <SkeletonPosterTile key={i} width={tileWidth} />
          ))}
        </View>
      ))}
    </>
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <View className="px-4 pb-2 pt-4">
        <Text className="text-2xl font-bold text-text-primary">À découvrir</Text>
        <Text className="text-sm text-text-secondary">
          Films et séries tendance à ajouter à ta liste
        </Text>
      </View>

      <View className="flex-row gap-2 px-4 pb-3">
        {MEDIA_TYPE_FILTERS.map(({ value, label }) => {
          const active = mediaTypeFilter === value;
          return (
            <Pressable
              key={value}
              onPress={() => setMediaTypeFilter(value)}
              className={`rounded-full border px-3.5 py-2 ${
                active ? "border-accent bg-accent/10" : "border-border bg-transparent"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  active ? "text-accent" : "text-text-secondary"
                }`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoadingRecommendations ? (
        // Stage 1 — only "Recommandé pour toi" loads/shows here; Tendances
        // doesn't start rendering (not even its own skeleton) until this
        // resolves, so the two sections genuinely appear in order rather
        // than popping in whenever each fetch happens to finish.
        <View style={{ padding: SCREEN_PADDING }}>
          <Text className="mb-1 text-base font-semibold text-text-primary">
            Recommandé pour toi
          </Text>
          <Text className="mb-3 text-xs text-text-secondary">
            D'après tes films et séries les mieux notés
          </Text>
          {renderSkeletonRows(numColumns * 3)}
        </View>
      ) : !isLoadingTrending && discoverItems.length === 0 && recommended.length === 0 ? (
        <EmptyState
          icon="compass-outline"
          title="Rien à découvrir"
          message="Reviens plus tard pour de nouvelles suggestions."
        />
      ) : (
        <FlatList
          key={numColumns}
          data={isLoadingTrending ? [] : discoverItems}
          numColumns={numColumns}
          keyExtractor={(item) => `${item.media_type}-${item.id}`}
          removeClippedSubviews={false}
          contentContainerStyle={{ padding: SCREEN_PADDING }}
          columnWrapperStyle={{ gap: TILE_GAP, marginBottom: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#E63946"
              colors={["#E63946"]}
            />
          }
          ListHeaderComponent={
            <View className="mb-6">
              {recommended.length > 0 ? (
                <>
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
                          transitionTag={`poster-${item.media_type}-${item.id}`}
                        />
                      ))}
                    </View>
                  ))}
                </>
              ) : null}
              {isLoadingTrending || discoverItems.length > 0 ? (
                <Text className="mb-3 mt-6 text-base font-semibold text-text-primary">
                  Tendances
                </Text>
              ) : null}
            </View>
          }
          ListFooterComponent={isLoadingTrending ? renderSkeletonRows(numColumns * 3) : null}
          renderItem={({ item }) => (
            <PosterTile
              title={item.title ?? item.name ?? "Sans titre"}
              posterPath={item.poster_path}
              subtitle={(item.release_date ?? item.first_air_date)?.slice(0, 4)}
              onPress={() => router.push(`/details/${item.media_type}/${item.id}`)}
              width={tileWidth}
              transitionTag={`poster-${item.media_type}-${item.id}`}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
