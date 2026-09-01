import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { loadWatchlist, saveWatchlist } from "@/services/storage";
import type { MediaType, WatchlistItem, WatchStatus } from "@/types";

interface WatchlistContextValue {
  items: WatchlistItem[];
  isLoading: boolean;
  getItem: (mediaType: MediaType, id: number) => WatchlistItem | undefined;
  upsertItem: (item: Omit<WatchlistItem, "addedAt">) => Promise<void>;
  removeItem: (mediaType: MediaType, id: number) => Promise<void>;
  setStatus: (mediaType: MediaType, id: number, status: WatchStatus) => Promise<void>;
  setRating: (mediaType: MediaType, id: number, rating: number) => Promise<void>;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

function sameEntry(item: WatchlistItem, mediaType: MediaType, id: number) {
  return item.mediaType === mediaType && item.id === id;
}

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWatchlist()
      .then(setItems)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveWatchlist(items);
    }
  }, [items, isLoading]);

  const value = useMemo<WatchlistContextValue>(
    () => ({
      items,
      isLoading,
      getItem: (mediaType, id) => items.find((item) => sameEntry(item, mediaType, id)),
      upsertItem: async (item) => {
        setItems((prev) => {
          const existing = prev.find((entry) => sameEntry(entry, item.mediaType, item.id));
          if (existing) {
            return prev.map((entry) =>
              sameEntry(entry, item.mediaType, item.id) ? { ...entry, ...item } : entry
            );
          }
          return [...prev, { ...item, addedAt: new Date().toISOString() }];
        });
      },
      removeItem: async (mediaType, id) => {
        setItems((prev) => prev.filter((entry) => !sameEntry(entry, mediaType, id)));
      },
      setStatus: async (mediaType, id, status) => {
        setItems((prev) =>
          prev.map((entry) => (sameEntry(entry, mediaType, id) ? { ...entry, status } : entry))
        );
      },
      setRating: async (mediaType, id, rating) => {
        setItems((prev) =>
          prev.map((entry) => (sameEntry(entry, mediaType, id) ? { ...entry, rating } : entry))
        );
      },
    }),
    [items, isLoading]
  );

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error("useWatchlist doit être utilisé à l'intérieur de WatchlistProvider");
  }
  return context;
}
