import AsyncStorage from "@react-native-async-storage/async-storage";

import type { WatchlistItem } from "@/types";

const WATCHLIST_KEY = "@cinelog/watchlist";

export async function loadWatchlist(): Promise<WatchlistItem[]> {
  const raw = await AsyncStorage.getItem(WATCHLIST_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as WatchlistItem[];
  } catch {
    return [];
  }
}

export async function saveWatchlist(items: WatchlistItem[]): Promise<void> {
  await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(items));
}
