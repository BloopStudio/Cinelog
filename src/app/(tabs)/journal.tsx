import { router } from "expo-router";
import { useMemo } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { MovieCard } from "@/components/MovieCard";
import { useWatchlist } from "@/context/WatchlistContext";
import type { WatchlistItem } from "@/types";

type Row =
  | { type: "header"; key: string; label: string }
  | { type: "item"; key: string; item: WatchlistItem };

const MONTH_FORMATTER = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

function monthLabel(date: Date): string {
  const label = MONTH_FORMATTER.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function JournalScreen() {
  const { items, removeItem } = useWatchlist();

  const rows = useMemo<Row[]>(() => {
    const watched = [...items]
      .filter((item) => item.status === "watched")
      .sort(
        (a, b) =>
          new Date(b.watchedAt ?? b.addedAt).getTime() -
          new Date(a.watchedAt ?? a.addedAt).getTime()
      );

    const result: Row[] = [];
    let lastMonthKey = "";
    watched.forEach((item) => {
      const date = new Date(item.watchedAt ?? item.addedAt);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (monthKey !== lastMonthKey) {
        lastMonthKey = monthKey;
        result.push({ type: "header", key: monthKey, label: monthLabel(date) });
      }
      result.push({ type: "item", key: `${item.mediaType}-${item.id}`, item });
    });
    return result;
  }, [items]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <View className="px-4 pb-2 pt-4">
        <Text className="text-2xl font-bold text-text-primary">Journal</Text>
        <Text className="text-sm text-text-secondary">Ce que tu as vu, dans l'ordre</Text>
      </View>

      {rows.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title="Journal vide"
          message="Les titres marqués comme vus apparaîtront ici, groupés par mois."
        />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(row) => row.key}
          removeClippedSubviews={false}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item: row }) =>
            row.type === "header" ? (
              <Text className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                {row.label}
              </Text>
            ) : (
              <MovieCard
                title={row.item.title}
                posterPath={row.item.posterPath}
                subtitle={row.item.releaseDate?.slice(0, 4)}
                status={row.item.status}
                rating={row.item.rating}
                onPress={() => router.push(`/details/${row.item.mediaType}/${row.item.id}`)}
                onRemove={() => removeItem(row.item.mediaType, row.item.id)}
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}
