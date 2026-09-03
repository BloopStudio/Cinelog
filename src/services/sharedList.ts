import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";

import { ensureSignedIn, getFirebaseDb } from "@/services/firebase";
import type { MediaType, WatchlistItem, WatchStatus } from "@/types";

// Excludes visually ambiguous characters (0/O, 1/I).
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_LENGTH = 8;

function generateListCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

function itemDocId(mediaType: MediaType, id: number) {
  return `${mediaType}-${id}`;
}

// Firestore's first network round-trip after a cold start (fresh gRPC/
// long-polling channel) is prone to spurious transient failures — the SDK's
// offline write queue can end up delivering the write anyway a moment
// later, but the promise from *that* call already rejected. Retrying the
// exact same, idempotent (overwrite-based) operation is safe and clears up
// most of these without the user having to notice.
class NotFoundError extends Error {}

async function withRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      lastError = error;
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 700 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export async function createSharedList(items: WatchlistItem[]): Promise<string> {
  const user = await ensureSignedIn();
  const code = generateListCode();
  const db = getFirebaseDb();

  await withRetry(async () => {
    const batch = writeBatch(db);
    batch.set(doc(db, "lists", code), { code, createdAt: serverTimestamp() });
    batch.set(doc(db, "lists", code, "members", user.uid), { joinedAt: serverTimestamp() });
    items.forEach((item) => {
      batch.set(doc(db, "lists", code, "items", itemDocId(item.mediaType, item.id)), item);
    });
    await batch.commit();
  });

  return code;
}

export async function joinSharedList(
  code: string,
  localItems: WatchlistItem[]
): Promise<WatchlistItem[]> {
  const normalizedCode = code.trim().toUpperCase();
  const user = await ensureSignedIn();
  const db = getFirebaseDb();

  return withRetry(async () => {
    const listSnap = await getDoc(doc(db, "lists", normalizedCode));
    if (!listSnap.exists()) {
      throw new NotFoundError("Aucune liste ne correspond à ce code.");
    }

    await setDoc(doc(db, "lists", normalizedCode, "members", user.uid), {
      joinedAt: serverTimestamp(),
    });

    const itemsSnap = await getDocs(collection(db, "lists", normalizedCode, "items"));
    const remoteItems = itemsSnap.docs.map((itemDoc) => itemDoc.data() as WatchlistItem);
    const remoteKeys = new Set(remoteItems.map((item) => itemDocId(item.mediaType, item.id)));

    // Joining a shared list must not silently wipe whatever this device
    // was already tracking locally — anything not already in the shared
    // list gets merged into it instead of discarded.
    const localOnlyItems = localItems.filter(
      (item) => !remoteKeys.has(itemDocId(item.mediaType, item.id))
    );
    if (localOnlyItems.length > 0) {
      const batch = writeBatch(db);
      localOnlyItems.forEach((item) => {
        batch.set(
          doc(db, "lists", normalizedCode, "items", itemDocId(item.mediaType, item.id)),
          item
        );
      });
      await batch.commit();
    }

    return [...remoteItems, ...localOnlyItems];
  });
}

export async function leaveSharedList(listId: string): Promise<void> {
  const user = await ensureSignedIn();
  await deleteDoc(doc(getFirebaseDb(), "lists", listId, "members", user.uid));
}

export function subscribeToSharedList(
  listId: string,
  onItems: (items: WatchlistItem[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(getFirebaseDb(), "lists", listId, "items"),
    (snapshot) => onItems(snapshot.docs.map((itemDoc) => itemDoc.data() as WatchlistItem)),
    onError
  );
}

export async function upsertRemoteItem(listId: string, item: WatchlistItem): Promise<void> {
  await setDoc(
    doc(getFirebaseDb(), "lists", listId, "items", itemDocId(item.mediaType, item.id)),
    item
  );
}

export async function removeRemoteItem(
  listId: string,
  mediaType: MediaType,
  id: number
): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), "lists", listId, "items", itemDocId(mediaType, id)));
}

export async function setRemoteStatus(
  listId: string,
  mediaType: MediaType,
  id: number,
  status: WatchStatus
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), "lists", listId, "items", itemDocId(mediaType, id)), {
    status,
  });
}

export async function setRemoteRating(
  listId: string,
  mediaType: MediaType,
  id: number,
  rating: number
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), "lists", listId, "items", itemDocId(mediaType, id)), {
    rating,
  });
}

export async function setRemoteCurrentSeason(
  listId: string,
  mediaType: MediaType,
  id: number,
  currentSeason: number
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), "lists", listId, "items", itemDocId(mediaType, id)), {
    currentSeason,
  });
}

export async function setRemoteWatchedAt(
  listId: string,
  mediaType: MediaType,
  id: number,
  watchedAt: string
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), "lists", listId, "items", itemDocId(mediaType, id)), {
    watchedAt,
  });
}

export async function setRemoteRuntimeMinutes(
  listId: string,
  mediaType: MediaType,
  id: number,
  runtimeMinutes: number
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), "lists", listId, "items", itemDocId(mediaType, id)), {
    runtimeMinutes,
  });
}
