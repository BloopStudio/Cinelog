import type { MediaType, SearchResult, TMDBDetails, TMDBSearchResult } from "@/types";

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

export interface SearchPage {
  results: SearchResult[];
  page: number;
  totalPages: number;
}

export async function searchMulti(query: string, page = 1): Promise<SearchPage> {
  if (!query.trim()) return { results: [], page: 1, totalPages: 0 };

  const data = await tmdbFetch<{
    results: (SearchResult & { media_type: string })[];
    page: number;
    total_pages: number;
  }>("/search/multi", { query, include_adult: "false", page: String(page) });

  return {
    results: data.results.filter(
      (item): item is SearchResult =>
        item.media_type === "movie" || item.media_type === "tv" || item.media_type === "person"
    ),
    page: data.page,
    totalPages: data.total_pages,
  };
}

export async function getPerson(id: number): Promise<{ id: number; name: string; profile_path: string | null }> {
  return tmdbFetch(`/person/${id}`);
}

export async function getPersonCredits(id: number): Promise<TMDBSearchResult[]> {
  const data = await tmdbFetch<{ cast: (TMDBSearchResult & { media_type: string })[] }>(
    `/person/${id}/combined_credits`
  );

  const seen = new Set<string>();
  return data.cast
    .filter(
      (item): item is TMDBSearchResult => item.media_type === "movie" || item.media_type === "tv"
    )
    .filter((item) => {
      const key = `${item.media_type}-${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const dateA = a.release_date ?? a.first_air_date ?? "";
      const dateB = b.release_date ?? b.first_air_date ?? "";
      return dateB.localeCompare(dateA);
    });
}

export async function getDetails(mediaType: MediaType, id: number): Promise<TMDBDetails> {
  const data = await tmdbFetch<TMDBDetails>(`/${mediaType}/${id}`, {
    append_to_response: "credits",
  });
  return { ...data, media_type: mediaType };
}

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function getTrending(): Promise<TMDBSearchResult[]> {
  // Trending is the same for everyone all week, so pull a couple of pages
  // and shuffle them: without this, "À découvrir" would show the exact
  // same handful of titles every time the app is opened.
  const [page1, page2] = await Promise.all([
    tmdbFetch<{ results: (TMDBSearchResult & { media_type: string })[] }>("/trending/all/week", {
      page: "1",
    }),
    tmdbFetch<{ results: (TMDBSearchResult & { media_type: string })[] }>("/trending/all/week", {
      page: "2",
    }),
  ]);

  const combined = [...page1.results, ...page2.results].filter(
    (item): item is TMDBSearchResult => item.media_type === "movie" || item.media_type === "tv"
  );

  return shuffle(combined);
}
