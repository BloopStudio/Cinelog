import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { MovieCard } from "@/components/MovieCard";
import { PersonCard } from "@/components/PersonCard";
import { searchMulti } from "@/services/tmdb";
import type { SearchResult } from "@/types";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setError(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await searchMulti(trimmed);
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 pb-2 pt-4">
        <Text className="text-2xl font-bold text-text-primary">Recherche</Text>
      </View>

      <View className="mx-4 mb-3 flex-row items-center gap-2 rounded-xl bg-surface px-3 py-2.5">
        <Ionicons name="search" size={18} color="#9AA5B1" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Titre, film, série ou acteur..."
          placeholderTextColor="#9AA5B1"
          autoCapitalize="none"
          autoCorrect={false}
          className="flex-1 text-base text-text-primary"
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#E63946" />
        </View>
      ) : error ? (
        <EmptyState icon="alert-circle-outline" title="Oups" message={error} />
      ) : results.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title={query.trim() ? "Aucun résultat" : "Cherche un titre"}
          message={
            query.trim()
              ? "Essaie un autre titre."
              : "Tape le nom d'un film ou d'une série pour commencer."
          }
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.media_type}-${item.id}`}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) =>
            item.media_type === "person" ? (
              <PersonCard
                name={item.name}
                profilePath={item.profile_path}
                onPress={() => router.push(`/actor/${item.id}`)}
              />
            ) : (
              <MovieCard
                title={item.title ?? item.name ?? "Sans titre"}
                posterPath={item.poster_path}
                subtitle={(item.release_date ?? item.first_air_date)?.slice(0, 4)}
                onPress={() => router.push(`/details/${item.media_type}/${item.id}`)}
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}
