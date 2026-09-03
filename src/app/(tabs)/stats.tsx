import { useEffect, useMemo, useRef } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { useWatchlist } from "@/context/WatchlistContext";
import { estimateRuntimeMinutes, getDetails } from "@/services/tmdb";

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-surface p-4">
      <Text numberOfLines={1} className="text-xl font-bold text-text-primary">
        {value}
      </Text>
      <Text className="mt-1 text-xs text-text-secondary">{label}</Text>
    </View>
  );
}

export default function StatsScreen() {
  const { items, setRuntimeMinutes } = useWatchlist();

  const watched = useMemo(() => items.filter((item) => item.status === "watched"), [items]);
  const rated = useMemo(() => items.filter((item) => item.rating > 0), [items]);

  // Titles added before runtime tracking existed have no runtimeMinutes —
  // "temps estimé" would silently ignore them. Fetch and cache it for
  // whichever watched items are still missing it, once, in the background.
  // requestedRef dedupes across re-renders so each title is only fetched
  // once per screen visit, even though "watched" is a new array every time
  // an item gets backfilled.
  const requestedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    watched.forEach((item) => {
      if (item.runtimeMinutes !== undefined) return;
      const key = `${item.mediaType}-${item.id}`;
      if (requestedRef.current.has(key)) return;
      requestedRef.current.add(key);

      getDetails(item.mediaType, item.id)
        .then((details) => {
          const minutes = estimateRuntimeMinutes(details, item.mediaType);
          if (minutes) setRuntimeMinutes(item.mediaType, item.id, minutes);
        })
        .catch(() => {
          // silencieux : le titre restera simplement exclu de l'estimation
        });
    });
  }, [watched, setRuntimeMinutes]);

  const totalHours = Math.round(
    watched.reduce((sum, item) => sum + (item.runtimeMinutes ?? 0), 0) / 60
  );
  const averageRating = rated.length
    ? (rated.reduce((sum, item) => sum + item.rating, 0) / rated.length).toFixed(1)
    : null;

  const genreCounts = useMemo(() => {
    const counts = new Map<string, number>();
    watched.forEach((item) => {
      item.genres?.forEach((genre) => counts.set(genre, (counts.get(genre) ?? 0) + 1));
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [watched]);

  const topGenre = genreCounts[0]?.[0];
  const maxGenreCount = genreCounts[0]?.[1] ?? 1;

  if (items.length === 0) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <View className="px-4 pb-2 pt-4">
          <Text className="text-2xl font-bold text-text-primary">Bilan</Text>
        </View>
        <EmptyState
          icon="stats-chart-outline"
          title="Rien à afficher"
          message="Ajoute des titres et marque-les comme vus pour voir ton bilan ici."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold text-text-primary">Bilan</Text>
        <Text className="mb-5 text-sm text-text-secondary">Basé sur ta liste</Text>

        <View className="gap-3">
          <View className="flex-row gap-3">
            <StatTile label="titres vus" value={String(watched.length)} />
            <StatTile label="temps estimé" value={totalHours > 0 ? `${totalHours}h` : "—"} />
          </View>
          <View className="flex-row gap-3">
            <StatTile label="note moyenne" value={averageRating ? `${averageRating}★` : "—"} />
            <StatTile label="genre préféré" value={topGenre ?? "—"} />
          </View>
        </View>

        {genreCounts.length > 0 ? (
          <View className="mt-6">
            <Text className="mb-3 text-sm font-semibold text-text-secondary">
              Répartition par genre
            </Text>
            <View className="gap-2.5">
              {genreCounts.slice(0, 8).map(([genre, count]) => (
                <View key={genre} className="flex-row items-center gap-3">
                  <Text numberOfLines={1} className="w-24 text-xs text-text-secondary">
                    {genre}
                  </Text>
                  <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-alt">
                    <View
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(6, (count / maxGenreCount) * 100)}%` }}
                    />
                  </View>
                  <Text className="w-5 text-right text-xs text-text-secondary">{count}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
