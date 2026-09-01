import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, SafeAreaView, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { MovieCard } from "@/components/MovieCard";
import { STATUS_LABELS } from "@/constants/status";
import { useWatchlist } from "@/context/WatchlistContext";
import type { WatchStatus } from "@/types";

type Filter = "all" | WatchStatus;

const FILTERS: Filter[] = ["all", "watching", "to_watch", "watched"];

export default function WatchlistScreen() {
  const { items, isLoading, removeItem } = useWatchlist();
  const [filter, setFilter] = useState<Filter>("all");

  const filteredItems = useMemo(() => {
    const sorted = [...items].sort(
      (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    );
    if (filter === "all") return sorted;
    return sorted.filter((item) => item.status === filter);
  }, [items, filter]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pb-2 pt-4">
        <Text className="text-2xl font-bold text-text-primary">CinéLog</Text>
        <Text className="text-sm text-text-secondary">Ta liste de films et séries</Text>
      </View>

      <View className="flex-row gap-2 px-4 py-3">
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

      {!isLoading && filteredItems.length === 0 ? (
        <EmptyState
          icon="film-outline"
          title="Liste vide"
          message="Recherche un film ou une série pour l'ajouter à ta liste."
        />
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
        />
      )}
    </SafeAreaView>
  );
}
