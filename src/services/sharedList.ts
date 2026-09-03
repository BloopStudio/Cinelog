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

export async function createSharedList(items: WatchlistItem[]): Promise<string> {
  const user = await ensureSignedIn();
  const code = generateListCode();
  const db = getFirebaseDb();

  const batch = writeBatch(db);
  batch.set(doc(db, "lists", code), { code, createdAt: serverTimestamp() });
  batch.set(doc(db, "lists", code, "members", user.uid), { joinedAt: serverTimestamp() });
  items.forEach((item) => {
    batch.set(doc(db, "lists", code, "items", itemDocId(item.mediaType, item.id)), item);
  });
  await batch.commit();

  return code;
}

export async function joinSharedList(code: string): Promise<WatchlistItem[]> {
  const normalizedCode = code.trim().toUpperCase();
  const user = await ensureSignedIn();
  const db = getFirebaseDb();
  const listRef = doc(db, "lists", normalizedCode);
  const listSnap = await getDoc(listRef);
  if (!listSnap.exists()) {
    throw new Error("Aucune liste ne correspond à ce code.");
  }

  await setDoc(doc(db, "lists", normalizedCode, "members", user.uid), {
    joinedAt: serverTimestamp(),
  });

  const itemsSnap = await getDocs(collection(db, "lists", normalizedCode, "items"));
  return itemsSnap.docs.map((itemDoc) => itemDoc.data() as WatchlistItem);
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
