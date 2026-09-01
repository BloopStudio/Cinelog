import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { MovieCard } from "@/components/MovieCard";
import { PosterTile } from "@/components/PosterTile";
import { STATUS_LABELS } from "@/constants/status";
import { useWatchlist } from "@/context/WatchlistContext";
import { getTrending } from "@/services/tmdb";
import type { MediaType, TMDBSearchResult, WatchStatus } from "@/types";

type Filter = "all" | WatchStatus;
type MediaTypeFilter = "all" | MediaType;

const FILTERS: Filter[] = ["all", "watching", "to_watch", "watched"];
const MEDIA_TYPE_FILTERS: { value: MediaTypeFilter; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "movie", label: "Films" },
  { value: "tv", label: "Séries" },
];

export default function WatchlistScreen() {
  const { items, isLoading, removeItem } = useWatchlist();
  const [filter, setFilter] = useState<Filter>("all");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaTypeFilter>("all");
  const [trending, setTrending] = useState<TMDBSearchResult[]>([]);

  useEffect(() => {
    getTrending()
      .then(setTrending)
      .catch(() => setTrending([]));
  }, []);

  const filteredItems = useMemo(() => {
    const sorted = [...items].sort(
      (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    );
    return sorted
      .filter((item) => filter === "all" || item.status === filter)
      .filter((item) => mediaTypeFilter === "all" || item.mediaType === mediaTypeFilter);
  }, [items, filter, mediaTypeFilter]);

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
        <Text className="text-2xl font-bold text-text-primary">CinéLog</Text>
        <Text className="text-sm text-text-secondary">Ta liste de films et séries</Text>
      </View>

      <View className="flex-row gap-2 px-4 pt-3">
        {FILTERS.map((value) => {
          const active = filter === value;
          return (
            <Pressable
              key={value}
              onPress={() => setFilter(value)}
              className={`rounded-full px-3 py-1.5 ${active ? "bg-primary" : "bg-surface"}`}
            >
              <Text
                className={`text-xs font-semibold ${
                  active ? "text-white" : "text-text-secondary"
                }`}
              >
                {value === "all" ? "Tout" : STATUS_LABELS[value]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row gap-2 px-4 pb-3 pt-2">
        {MEDIA_TYPE_FILTERS.map(({ value, label }) => {
          const active = mediaTypeFilter === value;
          return (
            <Pressable
              key={value}
              onPress={() => setMediaTypeFilter(value)}
              className={`rounded-full border px-3 py-1 ${
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

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#E63946" />
        </View>
      ) : filteredItems.length === 0 ? (
        <>
          <EmptyState
            icon="film-outline"
            title="Liste vide"
            message="Recherche un film ou une série pour l'ajouter à ta liste."
          />
          {discoverItems.length > 0 ? (
            <View className="pb-6">
              <Text className="px-4 pb-3 text-base font-semibold text-text-primary">
                À découvrir
              </Text>
              <FlatList
                data={discoverItems}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => `${item.media_type}-${item.id}`}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                renderItem={({ item }) => (
                  <PosterTile
                    title={item.title ?? item.name ?? "Sans titre"}
                    posterPath={item.poster_path}
                    subtitle={(item.release_date ?? item.first_air_date)?.slice(0, 4)}
                    onPress={() => router.push(`/details/${item.media_type}/${item.id}`)}
                  />
                )}
              />
            </View>
          ) : null}
        </>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => `${item.mediaType}-${item.id}`}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <MovieCard
              title={item.title}
              posterPath={item.posterPath}
              subtitle={item.releaseDate?.slice(0, 4)}
              status={item.status}
              rating={item.rating}
              onPress={() =>
                router.push(`/details/${item.mediaType}/${item.id}`)
              }
              onRemove={() => removeItem(item.mediaType, item.id)}
            />
          )}
          ListFooterComponent={
            discoverItems.length > 0 ? (
              <View className="pb-2 pt-4">
                <Text className="pb-3 text-base font-semibold text-text-primary">
                  À découvrir
                </Text>
                <FlatList
                  data={discoverItems}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => `${item.media_type}-${item.id}`}
                  renderItem={({ item }) => (
                    <PosterTile
                      title={item.title ?? item.name ?? "Sans titre"}
                      posterPath={item.poster_path}
                      subtitle={(item.release_date ?? item.first_air_date)?.slice(0, 4)}
                      onPress={() => router.push(`/details/${item.media_type}/${item.id}`)}
                    />
                  )}
                />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
