import type { MediaType, SearchResult, TMDBDetails, TMDBSearchResult } from "@/types";

const BASE_URL = "https://api.themoviedb.org/3";
const ACCESS_TOKEN = process.env.EXPO_PUBLIC_TMDB_ACCESS_TOKEN;

export const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export function posterUrl(path: string | null, size: "w185" | "w342" | "w500" = "w342") {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
}

export function providerLogoUrl(path: string | null) {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}/w92${path}`;
}

// Région utilisée pour "où regarder" (TMDB retourne les disponibilités par
// pays) — l'app est en français, on affiche la disponibilité en France.
export const WATCH_PROVIDER_REGION = "FR";

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
    append_to_response: "credits,watch/providers",
  });
  return { ...data, media_type: mediaType };
}

// A watched date earlier than the release date doesn't make sense — this is
// the floor both the date picker and the one-time backfill clamp to.
export function getReleaseDateFloor(details: TMDBDetails): Date | null {
  const raw = details.release_date || details.first_air_date;
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// TMDB keeps recommendations within the same media type as the source
// title (movie → movies, tv → tv shows), and the results don't carry a
// media_type field of their own since the endpoint is already scoped.
export async function getRecommendations(
  mediaType: MediaType,
  id: number
): Promise<TMDBSearchResult[]> {
  const data = await tmdbFetch<{ results: TMDBSearchResult[] }>(
    `/${mediaType}/${id}/recommendations`
  );
  return data.results.map((item) => ({ ...item, media_type: mediaType }));
}

// Movies carry their own runtime; TV shows don't (TMDB gives per-episode
// runtime instead), so it's approximated as episodes × runtime, falling
// back to a 45min/episode estimate when TMDB doesn't provide one.
export function estimateRuntimeMinutes(
  details: TMDBDetails,
  mediaType: MediaType
): number | undefined {
  if (mediaType === "movie") return details.runtime;
  if (!details.number_of_episodes) return undefined;
  const perEpisode = details.episode_run_time?.[0] ?? 45;
  return details.number_of_episodes * perEpisode;
}

// The other films in a movie's franchise (e.g. Divergente 2, Divergente 3
// for Divergente) — TMDB groups these as a "collection". TV shows don't
// have this concept, they have seasons instead.
export async function getCollectionMovies(collectionId: number): Promise<TMDBSearchResult[]> {
  const data = await tmdbFetch<{ parts: TMDBSearchResult[] }>(`/collection/${collectionId}`);
  return data.parts
    .map((part) => ({ ...part, media_type: "movie" as const }))
    .sort((a, b) => (a.release_date ?? "").localeCompare(b.release_date ?? ""));
}

export function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function getTrending(): Promise<{ movies: TMDBSearchResult[]; tv: TMDBSearchResult[] }> {
  // Trending is the same for everyone all week, so pull a couple of pages
  // and shuffle them: without this, "À découvrir" would show the exact
  // same handful of titles every time the app is opened. Fetched per type
  // (rather than one mixed /trending/all/week call) so filtering the
  // discover screen to "Films" or "Séries" always has a full pool to draw
  // from instead of whatever happened to survive the mix.
  const [moviePage1, moviePage2, tvPage1, tvPage2] = await Promise.all([
    tmdbFetch<{ results: TMDBSearchResult[] }>("/trending/movie/week", { page: "1" }),
    tmdbFetch<{ results: TMDBSearchResult[] }>("/trending/movie/week", { page: "2" }),
    tmdbFetch<{ results: TMDBSearchResult[] }>("/trending/tv/week", { page: "1" }),
    tmdbFetch<{ results: TMDBSearchResult[] }>("/trending/tv/week", { page: "2" }),
  ]);

  function dedupeAndTag(results: TMDBSearchResult[], mediaType: MediaType): TMDBSearchResult[] {
    const seen = new Set<number>();
    const tagged = results
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .map((item) => ({ ...item, media_type: mediaType }));
    return shuffle(tagged);
  }

  return {
    movies: dedupeAndTag([...moviePage1.results, ...moviePage2.results], "movie"),
    tv: dedupeAndTag([...tvPage1.results, ...tvPage2.results], "tv"),
  };
}

