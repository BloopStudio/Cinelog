import AsyncStorage from "@react-native-async-storage/async-storage";

import type { WatchlistItem } from "@/types";

const WATCHLIST_KEY = "@cinelog/watchlist";
const SHARED_LIST_ID_KEY = "@cinelog/shared-list-id";

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

export async function loadSharedListId(): Promise<string | null> {
  return AsyncStorage.getItem(SHARED_LIST_ID_KEY);
}

export async function saveSharedListId(listId: string | null): Promise<void> {
  if (listId) {
    await AsyncStorage.setItem(SHARED_LIST_ID_KEY, listId);
  } else {
    await AsyncStorage.removeItem(SHARED_LIST_ID_KEY);
  }
}
