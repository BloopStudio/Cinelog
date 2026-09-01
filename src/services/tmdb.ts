import type { MediaType, TMDBDetails, TMDBSearchResult } from "@/types";

const BASE_URL = "https://api.themoviedb.org/3";
const ACCESS_TOKEN = process.env.EXPO_PUBLIC_TMDB_ACCESS_TOKEN;

export const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export function posterUrl(path: string | null, size: "w185" | "w342" | "w500" = "w342") {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  if (!ACCESS_TOKEN) {
    throw new Error(
      "Clé TMDB manquante. Ajoute EXPO_PUBLIC_TMDB_ACCESS_TOKEN dans un fichier .env (voir .env.example)."
    );
  }

  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("language", "fr-FR");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur TMDB (${response.status})`);
  }

  return response.json();
}

export async function searchMulti(query: string): Promise<TMDBSearchResult[]> {
  if (!query.trim()) return [];

  const data = await tmdbFetch<{ results: (TMDBSearchResult & { media_type: string })[] }>(
    "/search/multi",
    { query, include_adult: "false" }
  );

  return data.results.filter(
    (item): item is TMDBSearchResult => item.media_type === "movie" || item.media_type === "tv"
  );
}

export async function getDetails(mediaType: MediaType, id: number): Promise<TMDBDetails> {
  const data = await tmdbFetch<TMDBDetails>(`/${mediaType}/${id}`);
  return { ...data, media_type: mediaType };
}

export async function getTrending(): Promise<TMDBSearchResult[]> {
  const data = await tmdbFetch<{ results: (TMDBSearchResult & { media_type: string })[] }>(
    "/trending/all/week"
  );

  return data.results.filter(
    (item): item is TMDBSearchResult => item.media_type === "movie" || item.media_type === "tv"
  );
}
