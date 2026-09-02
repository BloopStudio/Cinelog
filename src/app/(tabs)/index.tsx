import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { MovieCard } from "@/components/MovieCard";
import { STATUS_LABELS } from "@/constants/status";
import { useWatchlist } from "@/context/WatchlistContext";
import type { MediaType, WatchStatus } from "@/types";

type Filter = "all" | WatchStatus;
type MediaTypeFilter = "all" | MediaType;
type SortOption = "recent" | "rating" | "title";

const FILTERS: Filter[] = ["all", "watching", "to_watch", "watched"];
const MEDIA_TYPE_FILTERS: { value: MediaTypeFilter; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "movie", label: "Films" },
  { value: "tv", label: "Séries" },
];
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recent", label: "Récents" },
  { value: "rating", label: "Mieux notés" },
  { value: "title", label: "Titre A-Z" },
];

export default function WatchlistScreen() {
  const { items, isLoading, removeItem } = useWatchlist();
  const [filter, setFilter] = useState<Filter>("all");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaTypeFilter>("all");
  const [genreFilter, setGenreFilter] = useState<string | "all">("all");
  const [sort, setSort] = useState<SortOption>("recent");

  const availableGenres = useMemo(() => {
    const genres = new Set<string>();
    items.forEach((item) => item.genres?.forEach((genre) => genres.add(genre)));
    return Array.from(genres).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    const filtered = items
      .filter((item) => filter === "all" || item.status === filter)
      .filter((item) => mediaTypeFilter === "all" || item.mediaType === mediaTypeFilter)
      .filter((item) => genreFilter === "all" || item.genres?.includes(genreFilter));

    return filtered.sort((a, b) => {
      if (sort === "rating") return (b.rating ?? -1) - (a.rating ?? -1);
      if (sort === "title") return a.title.localeCompare(b.title);
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    });
  }, [items, filter, mediaTypeFilter, genreFilter, sort]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <View className="px-4 pb-2 pt-4">
        <Text className="text-2xl font-bold text-text-primary">CinéLog</Text>
        <Text className="text-sm text-text-secondary">
          {filteredItems.length} titre{filteredItems.length > 1 ? "s" : ""} dans ta liste
        </Text>
      </View>

      <View className="gap-3 pb-3 pt-3">
        <View className="flex-row flex-wrap gap-2 px-4">
          {FILTERS.map((value) => {
            const active = filter === value;
            return (
              <Pressable
                key={value}
                onPress={() => setFilter(value)}
                className={`rounded-full px-3.5 py-2 ${active ? "bg-primary" : "bg-surface"}`}
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

        <View className="flex-row items-center gap-2 px-4">
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

          {availableGenres.length > 0 ? (
            <View className="h-6 w-px bg-border" />
          ) : null}

          {availableGenres.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, alignItems: "center" }}
            >
              <Pressable
                onPress={() => setGenreFilter("all")}
                className={`rounded-full border px-3.5 py-2 ${
                  genreFilter === "all"
                    ? "border-accent bg-accent/10"
                    : "border-border bg-transparent"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    genreFilter === "all" ? "text-accent" : "text-text-secondary"
                  }`}
                >
                  Tous genres
                </Text>
              </Pressable>
              {availableGenres.map((genre) => {
                const active = genreFilter === genre;
                return (
                  <Pressable
                    key={genre}
                    onPress={() => setGenreFilter(active ? "all" : genre)}
                    className={`rounded-full border px-3.5 py-2 ${
                      active ? "border-accent bg-accent/10" : "border-border bg-transparent"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        active ? "text-accent" : "text-text-secondary"
                      }`}
                    >
                      {genre}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, alignItems: "center", paddingHorizontal: 16 }}
        >
          <Ionicons name="swap-vertical-outline" size={14} color="#9AA5B1" />
          {SORT_OPTIONS.map(({ value, label }) => {
            const active = sort === value;
            return (
              <Pressable
                key={value}
                onPress={() => setSort(value)}
                className={`rounded-full px-3.5 py-2 ${active ? "bg-accent/10" : "bg-transparent"}`}
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
        </ScrollView>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#E63946" />
        </View>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon="film-outline"
          title="Liste vide"
          message="Recherche un film ou une série pour l'ajouter à ta liste, ou regarde l'onglet À découvrir."
        />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => `${item.mediaType}-${item.id}`}
          removeClippedSubviews={false}
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
        />
      )}
    </SafeAreaView>
  );
}
