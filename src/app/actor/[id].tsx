import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { MovieCard } from "@/components/MovieCard";
import { useWatchlist } from "@/context/WatchlistContext";
import { getPerson, getPersonCredits, posterUrl } from "@/services/tmdb";
import type { TMDBSearchResult } from "@/types";

export default function ActorScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id);
  const { getItem } = useWatchlist();

  const [name, setName] = useState("");
  const [profilePath, setProfilePath] = useState<string | null>(null);
  const [credits, setCredits] = useState<TMDBSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    Promise.all([getPerson(id), getPersonCredits(id)])
      .then(([person, works]) => {
        if (cancelled) return;
        setName(person.name);
        setProfilePath(person.profile_path);
        setCredits(works);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erreur de chargement");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 pb-2 pt-4">
        <Image
          source={posterUrl(profilePath, "w185") ?? undefined}
          style={{ width: 56, height: 56, borderRadius: 28 }}
          contentFit="cover"
          className="bg-surface-alt"
        />
        <View className="flex-1">
          <Text className="text-xl font-bold text-text-primary">{name || "..."}</Text>
          <Text className="text-sm text-text-secondary">Filmographie</Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#E63946" />
        </View>
      ) : error || credits.length === 0 ? (
        <EmptyState
          icon="film-outline"
          title="Rien à afficher"
          message={error ?? "Aucune œuvre trouvée pour cette personne."}
        />
      ) : (
        <FlatList
          data={credits}
          keyExtractor={(item) => `${item.media_type}-${item.id}`}
          removeClippedSubviews={false}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const listItem = getItem(item.media_type, item.id);
            return (
              <MovieCard
                title={item.title ?? item.name ?? "Sans titre"}
                posterPath={item.poster_path}
                subtitle={(item.release_date ?? item.first_air_date)?.slice(0, 4)}
                status={listItem?.status}
                rating={listItem?.rating}
                onPress={() => router.push(`/details/${item.media_type}/${item.id}`)}
              />
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
