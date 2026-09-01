export type MediaType = "movie" | "tv";

export type WatchStatus = "to_watch" | "watching" | "watched";

export interface TMDBSearchResult {
  id: number;
  media_type: MediaType;
  title?: string;
  name?: string;
  poster_path: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface TMDBDetails extends TMDBSearchResult {
  genres: { id: number; name: string }[];
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  tagline: string;
  credits?: { cast: CastMember[] };
}

export interface WatchlistItem {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  overview: string;
  releaseDate: string;
  status: WatchStatus;
  rating: number;
  addedAt: string;
}
