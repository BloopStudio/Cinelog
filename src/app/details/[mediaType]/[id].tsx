import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RatingStars } from "@/components/RatingStars";
import { STATUS_LABELS, STATUS_ORDER } from "@/constants/status";
import { useWatchlist } from "@/context/WatchlistContext";
import { getDetails, posterUrl } from "@/services/tmdb";
import type { MediaType, TMDBDetails, WatchStatus } from "@/types";

export default function DetailsScreen() {
  const params = useLocalSearchParams<{ mediaType: string; id: string }>();
  const mediaType = params.mediaType as MediaType;
  const id = Number(params.id);

  const { getItem, upsertItem, removeItem, setStatus, setRating } = useWatchlist();
  const [details, setDetails] = useState<TMDBDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const listItem = getItem(mediaType, id);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getDetails(mediaType, id)
      .then((data) => {
        if (!cancelled) setDetails(data);
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
  }, [mediaType, id]);

  const title = details?.title ?? details?.name ?? "";
  const year = (details?.release_date ?? details?.first_air_date ?? "").slice(0, 4);

  const handleStatusPress = async (status: WatchStatus) => {
    if (!details) return;
    if (listItem) {
      await setStatus(mediaType, id, status);
    } else {
      await upsertItem({
        id,
        mediaType,
        title,
        posterPath: details.poster_path,
        overview: details.overview,
        releaseDate: details.release_date ?? details.first_air_date ?? "",
        status,
        rating: 0,
        genres: details.genres?.map((genre) => genre.name) ?? [],
      });
    }
  };

  const handleRatingChange = async (rating: number) => {
    if (!details) return;
    if (listItem) {
      await setRating(mediaType, id, rating);
    } else {
      await upsertItem({
        id,
        mediaType,
        title,
        posterPath: details.poster_path,
        overview: details.overview,
        releaseDate: details.release_date ?? details.first_air_date ?? "",
        status: "to_watch",
        rating,
        genres: details.genres?.map((genre) => genre.name) ?? [],
      });
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#E63946" />
      </View>
    );
  }

  if (error || !details) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-background px-8">
        <Ionicons name="alert-circle-outline" size={40} color="#4A5568" />
        <Text className="text-center text-text-secondary">{error ?? "Introuvable"}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView bounces={false}>
        <View className="relative">
          <Image
            source={posterUrl(details.poster_path, "w500") ?? undefined}
            style={{ width: "100%", height: 420 }}
            contentFit="cover"
            className="bg-surface-alt"
          />
          <View className="absolute bottom-0 left-0 right-0 h-24 bg-background/0" />
        </View>

        <SafeAreaView edges={["bottom"]} className="-mt-6 rounded-t-3xl bg-background px-5 pt-6">
          <Text className="text-2xl font-bold text-text-primary">{title}</Text>
          <Text className="mt-1 text-sm text-text-secondary">
            {year} · {mediaType === "movie" ? "Film" : "Série"}
            {details.runtime ? ` · ${details.runtime} min` : ""}
            {details.number_of_seasons
              ? ` · ${details.number_of_seasons} saison(s)`
              : ""}
          </Text>

          {details.genres?.length ? (
            <Text className="mt-1 text-sm text-text-secondary">
              {details.genres.map((genre) => genre.name).join(" · ")}
            </Text>
          ) : null}

          <View className="mt-5">
            <Text className="mb-2 text-sm font-semibold text-text-secondary">Ma note</Text>
            <RatingStars rating={listItem?.rating ?? 0} onChange={handleRatingChange} size={28} />
          </View>

          <View className="mt-5">
            <Text className="mb-2 text-sm font-semibold text-text-secondary">Statut</Text>
            <View className="flex-row gap-2">
              {STATUS_ORDER.map((status) => {
                const active = listItem?.status === status;
                return (
                  <Pressable
                    key={status}
                    onPress={() => handleStatusPress(status)}
                    className={`flex-1 items-center rounded-xl py-2.5 ${
                      active ? "bg-primary" : "bg-surface"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        active ? "text-white" : "text-text-secondary"
                      }`}
                    >
                      {STATUS_LABELS[status]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="mt-5">
            <Text className="mb-2 text-sm font-semibold text-text-secondary">Synopsis</Text>
            <Text className="text-sm leading-5 text-text-primary">
              {details.overview || "Pas de synopsis disponible."}
            </Text>
          </View>

          {details.credits?.cast?.length ? (
            <View className="mt-5">
              <Text className="mb-2 text-sm font-semibold text-text-secondary">Casting</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
                <View className="flex-row gap-3">
                  {details.credits.cast.slice(0, 15).map((actor) => (
                    <Pressable
                      key={actor.id}
                      onPress={() => router.push(`/actor/${actor.id}`)}
                      className="w-20"
                    >
                      <Image
                        source={posterUrl(actor.profile_path, "w185") ?? undefined}
                        style={{ width: 80, height: 80, borderRadius: 40 }}
                        contentFit="cover"
                        className="bg-surface-alt"
                      />
                      <Text numberOfLines={2} className="mt-1.5 text-xs font-semibold text-text-primary">
                        {actor.name}
                      </Text>
                      <Text numberOfLines={1} className="text-[11px] text-text-secondary">
                        {actor.character}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          ) : null}

          {listItem ? (
            <Pressable
              onPress={async () => {
                await removeItem(mediaType, id);
                router.back();
              }}
              className="mb-8 mt-6 flex-row items-center justify-center gap-2 rounded-xl bg-surface py-3"
            >
              <Ionicons name="trash-outline" size={18} color="#E63946" />
              <Text className="font-semibold text-primary">Retirer de ma liste</Text>
            </Pressable>
          ) : (
            <View className="mb-8 mt-6" />
          )}
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}
