import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RatingStars } from "@/components/RatingStars";
import { STATUS_LABELS, STATUS_ORDER } from "@/constants/status";
import { useWatchlist } from "@/context/WatchlistContext";
import {
  estimateRuntimeMinutes,
  getDetails,
  posterUrl,
  providerLogoUrl,
  WATCH_PROVIDER_REGION,
} from "@/services/tmdb";
import type { MediaType, TMDBDetails, WatchStatus } from "@/types";

function formatWatchedDate(iso: string | undefined): string {
  return (iso ? new Date(iso) : new Date()).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function DateField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  return (
    <View className="items-center gap-1.5">
      <Text className="text-[11px] text-text-secondary">{label}</Text>
      <Pressable onPress={() => onChange(value >= max ? min : value + 1)} hitSlop={8}>
        <Ionicons name="chevron-up" size={18} color="#9AA5B1" />
      </Pressable>
      <Text
        className="text-lg font-semibold text-text-primary"
        style={{ minWidth: 34, textAlign: "center" }}
      >
        {value}
      </Text>
      <Pressable onPress={() => onChange(value <= min ? max : value - 1)} hitSlop={8}>
        <Ionicons name="chevron-down" size={18} color="#9AA5B1" />
      </Pressable>
    </View>
  );
}

export default function DetailsScreen() {
  const params = useLocalSearchParams<{ mediaType: string; id: string }>();
  const mediaType = params.mediaType as MediaType;
  const id = Number(params.id);

  const { getItem, upsertItem, removeItem, setStatus, setRating, setCurrentSeason, setWatchedAt } =
    useWatchlist();
  const [details, setDetails] = useState<TMDBDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);
  const [draftDate, setDraftDate] = useState(() => new Date());

  const listItem = getItem(mediaType, id);

  const openDateModal = () => {
    setDraftDate(listItem?.watchedAt ? new Date(listItem.watchedAt) : new Date());
    setIsDateModalVisible(true);
  };

  const handleSaveDate = async () => {
    const noon = new Date(
      draftDate.getFullYear(),
      draftDate.getMonth(),
      draftDate.getDate(),
      12
    );
    await setWatchedAt(mediaType, id, noon.toISOString());
    setIsDateModalVisible(false);
  };

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
        runtimeMinutes: estimateRuntimeMinutes(details, mediaType),
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
        runtimeMinutes: estimateRuntimeMinutes(details, mediaType),
      });
    }
  };

  const handleSeasonChange = async (season: number) => {
    if (!details) return;
    if (listItem) {
      await setCurrentSeason(mediaType, id, season);
    } else {
      await upsertItem({
        id,
        mediaType,
        title,
        posterPath: details.poster_path,
        overview: details.overview,
        releaseDate: details.release_date ?? details.first_air_date ?? "",
        status: "watching",
        rating: 0,
        genres: details.genres?.map((genre) => genre.name) ?? [],
        runtimeMinutes: estimateRuntimeMinutes(details, mediaType),
        currentSeason: season,
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

  const providerRegion = details["watch/providers"]?.results?.[WATCH_PROVIDER_REGION];
  const providers = providerRegion?.flatrate ?? providerRegion?.rent ?? providerRegion?.buy;

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

          {listItem?.status === "watched" ? (
            <View className="mt-5">
              <Text className="mb-2 text-sm font-semibold text-text-secondary">Vu le</Text>
              <Pressable
                onPress={openDateModal}
                className="flex-row items-center justify-between rounded-xl bg-surface px-3.5 py-3"
              >
                <Text className="text-sm text-text-primary">
                  {formatWatchedDate(listItem.watchedAt)}
                </Text>
                <Ionicons name="calendar-outline" size={18} color="#9AA5B1" />
              </Pressable>
            </View>
          ) : null}

          {mediaType === "tv" && details.number_of_seasons ? (
            <View className="mt-5">
              <Text className="mb-2 text-sm font-semibold text-text-secondary">Saison en cours</Text>
              <View className="flex-row flex-wrap gap-2">
                {Array.from({ length: details.number_of_seasons }, (_, i) => i + 1).map(
                  (season) => {
                    const active = listItem?.currentSeason === season;
                    return (
                      <Pressable
                        key={season}
                        onPress={() => handleSeasonChange(season)}
                        className={`rounded-full px-3.5 py-2 ${
                          active ? "bg-primary" : "bg-surface"
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            active ? "text-white" : "text-text-secondary"
                          }`}
                        >
                          Saison {season}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </View>
            </View>
          ) : null}

          <View className="mt-5">
            <Text className="mb-2 text-sm font-semibold text-text-secondary">Synopsis</Text>
            <Text className="text-sm leading-5 text-text-primary">
              {details.overview || "Pas de synopsis disponible."}
            </Text>
          </View>

          {providers?.length ? (
            <View className="mt-5">
              <Text className="mb-2 text-sm font-semibold text-text-secondary">
                {providerRegion?.flatrate ? "Disponible sur" : "Disponible à la location/achat"}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {providers.map((provider) => (
                  <View
                    key={provider.provider_id}
                    className="flex-row items-center gap-2 rounded-xl bg-surface px-3 py-2"
                  >
                    <Image
                      source={providerLogoUrl(provider.logo_path) ?? undefined}
                      style={{ width: 22, height: 22, borderRadius: 6 }}
                      contentFit="cover"
                      className="bg-surface-alt"
                    />
                    <Text className="text-xs font-semibold text-text-primary">
                      {provider.provider_name}
                    </Text>
                  </View>
                ))}
              </View>
              <Pressable
                onPress={() => Linking.openURL(providerRegion?.link ?? "https://www.themoviedb.org")}
              >
                <Text className="mt-2 text-[11px] text-text-secondary">
                  Données fournies par JustWatch, via TMDB
                </Text>
              </Pressable>
            </View>
          ) : null}

          {details.credits?.cast?.length ? (
            <View className="mt-5">
              <Text className="mb-2 text-sm font-semibold text-text-secondary">Casting</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="-mx-5"
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
              >
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

      <Modal
        visible={isDateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDateModalVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/60 px-8">
          <View className="w-full rounded-2xl bg-surface p-5">
            <Text className="mb-4 text-center text-base font-semibold text-text-primary">
              Date de visionnage
            </Text>
            <View className="flex-row items-center justify-center gap-6">
              <DateField
                label="Jour"
                value={draftDate.getDate()}
                min={1}
                max={31}
                onChange={(day) =>
                  setDraftDate(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth(), day, 12)
                  )
                }
              />
              <DateField
                label="Mois"
                value={draftDate.getMonth() + 1}
                min={1}
                max={12}
                onChange={(month) =>
                  setDraftDate(
                    (prev) => new Date(prev.getFullYear(), month - 1, prev.getDate(), 12)
                  )
                }
              />
              <DateField
                label="Année"
                value={draftDate.getFullYear()}
                min={2000}
                max={new Date().getFullYear()}
                onChange={(year) =>
                  setDraftDate((prev) => new Date(year, prev.getMonth(), prev.getDate(), 12))
                }
              />
            </View>
            <View className="mt-6 flex-row gap-2">
              <Pressable
                onPress={() => setIsDateModalVisible(false)}
                className="flex-1 items-center rounded-xl bg-background py-3"
              >
                <Text className="text-sm font-semibold text-text-secondary">Annuler</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveDate}
                className="flex-1 items-center rounded-xl bg-primary py-3"
              >
                <Text className="text-sm font-semibold text-white">Valider</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
