import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { ensureSignedIn } from "@/services/firebase";
import {
  createSharedList as createSharedListRemote,
  joinSharedList as joinSharedListRemote,
  leaveSharedList as leaveSharedListRemote,
  removeRemoteItem,
  setRemoteRating,
  setRemoteStatus,
  subscribeToSharedList,
  upsertRemoteItem,
} from "@/services/sharedList";
import { loadSharedListId, loadWatchlist, saveSharedListId, saveWatchlist } from "@/services/storage";
import type { MediaType, WatchlistItem, WatchStatus } from "@/types";

export type SyncState = "solo" | "connecting" | "synced" | "error";

interface WatchlistContextValue {
  items: WatchlistItem[];
  isLoading: boolean;
  sharedListId: string | null;
  syncState: SyncState;
  getItem: (mediaType: MediaType, id: number) => WatchlistItem | undefined;
  upsertItem: (item: Omit<WatchlistItem, "addedAt">) => Promise<void>;
  removeItem: (mediaType: MediaType, id: number) => Promise<void>;
  setStatus: (mediaType: MediaType, id: number, status: WatchStatus) => Promise<void>;
  setRating: (mediaType: MediaType, id: number, rating: number) => Promise<void>;
  createSharedList: () => Promise<string>;
  joinSharedList: (code: string) => Promise<void>;
  leaveSharedList: () => Promise<void>;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

function sameEntry(item: WatchlistItem, mediaType: MediaType, id: number) {
  return item.mediaType === mediaType && item.id === id;
}

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sharedListId, setSharedListId] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<SyncState>("solo");

  useEffect(() => {
    Promise.all([loadWatchlist(), loadSharedListId()])
      .then(([storedItems, storedListId]) => {
        setItems(storedItems);
        setSharedListId(storedListId);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveWatchlist(items);
    }
  }, [items, isLoading]);

  // Once a shared list is joined/created, its id is cached locally (see
  // saveSharedListId) so this reconnects automatically on every launch —
  // no need to re-enter the code. On a fresh app process, Firebase Auth's
  // anonymous session must be explicitly restored (ensureSignedIn) before
  // subscribing: Firestore treats an app with no Auth instance registered
  // as unauthenticated, and the security rules silently reject every read.
  useEffect(() => {
    if (!sharedListId) {
      setSyncState("solo");
      return;
    }
    setSyncState("connecting");
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    ensureSignedIn()
      .then(() => {
        if (cancelled) return;
        unsubscribe = subscribeToSharedList(
          sharedListId,
          (remoteItems) => {
            setItems(remoteItems);
            setSyncState("synced");
          },
          () => setSyncState("error")
        );
      })
      .catch(() => setSyncState("error"));

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [sharedListId]);

  const value = useMemo<WatchlistContextValue>(
    () => ({
      items,
      isLoading,
      sharedListId,
      syncState,
      getItem: (mediaType, id) => items.find((item) => sameEntry(item, mediaType, id)),
      upsertItem: async (item) => {
        const existing = items.find((entry) => sameEntry(entry, item.mediaType, item.id));
        const merged: WatchlistItem = existing
          ? { ...existing, ...item }
          : { ...item, addedAt: new Date().toISOString() };

        setItems((prev) => {
          const has = prev.some((entry) => sameEntry(entry, item.mediaType, item.id));
          return has
            ? prev.map((entry) => (sameEntry(entry, item.mediaType, item.id) ? merged : entry))
            : [...prev, merged];
        });

        if (sharedListId) await upsertRemoteItem(sharedListId, merged);
      },
      removeItem: async (mediaType, id) => {
        setItems((prev) => prev.filter((entry) => !sameEntry(entry, mediaType, id)));
        if (sharedListId) await removeRemoteItem(sharedListId, mediaType, id);
      },
      setStatus: async (mediaType, id, status) => {
        setItems((prev) =>
          prev.map((entry) => (sameEntry(entry, mediaType, id) ? { ...entry, status } : entry))
        );
        if (sharedListId) await setRemoteStatus(sharedListId, mediaType, id, status);
      },
      setRating: async (mediaType, id, rating) => {
        setItems((prev) =>
          prev.map((entry) => (sameEntry(entry, mediaType, id) ? { ...entry, rating } : entry))
        );
        if (sharedListId) await setRemoteRating(sharedListId, mediaType, id, rating);
      },
      createSharedList: async () => {
        const code = await createSharedListRemote(items);
        await saveSharedListId(code);
        setSharedListId(code);
        return code;
      },
      joinSharedList: async (code) => {
        const mergedItems = await joinSharedListRemote(code, items);
        const normalizedCode = code.trim().toUpperCase();
        await saveSharedListId(normalizedCode);
        setItems(mergedItems);
        setSharedListId(normalizedCode);
      },
      leaveSharedList: async () => {
        if (sharedListId) await leaveSharedListRemote(sharedListId);
        await saveSharedListId(null);
        setSharedListId(null);
      },
    }),
    [items, isLoading, sharedListId, syncState]
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
