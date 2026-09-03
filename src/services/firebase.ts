import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  onAuthStateChanged,
  signInAnonymously,
  type Auth,
  type User,
  // @ts-expect-error getReactNativePersistence isn't in firebase's published
  // web types, even though Metro correctly resolves the React Native build
  // (with this export) at runtime. Known gap in the firebase package's types.
  getReactNativePersistence,
} from "firebase/auth";
import { initializeFirestore, type Firestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Everything here is lazily created on first use, not at module load. This
// file is imported transitively by WatchlistContext (mounted for every app
// launch), so an eager initializeApp/initializeAuth/initializeFirestore at
// the top level would run Firebase + native-module (AsyncStorage) work on
// every single startup — including for solo users who never touch "Partager
// ma liste" — and any hiccup there (a flaky emulator, a native module not
// fully ready yet) would crash or hang the whole app before it even renders.
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}

function getFirebaseAuth(): Auth {
  if (!auth) {
    const firebaseApp = getFirebaseApp();
    // initializeAuth throws if called twice on the same app (e.g. Metro
    // Fast Refresh re-running this module) — fall back to the
    // already-initialized instance instead of crashing.
    try {
      auth = initializeAuth(firebaseApp, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      auth = getAuth(firebaseApp);
    }
  }
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    // React Native's networking layer struggles with Firestore's default
    // gRPC streaming (connections can silently hang on some networks/
    // devices) — auto-detecting long-polling is the standard RN fix.
    db = initializeFirestore(getFirebaseApp(), { experimentalAutoDetectLongPolling: true });
  }
  return db;
}

let signInPromise: Promise<User> | null = null;

export function ensureSignedIn(): Promise<User> {
  const firebaseAuth = getFirebaseAuth();
  if (firebaseAuth.currentUser) return Promise.resolve(firebaseAuth.currentUser);
  if (!signInPromise) {
    signInPromise = new Promise<User>((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        firebaseAuth,
        (user) => {
          unsubscribe();
          if (user) {
            resolve(user);
            return;
          }
          signInAnonymously(firebaseAuth)
            .then((credential) => resolve(credential.user))
            .catch(reject);
        },
        reject
      );
      // A failed attempt (e.g. a transient network hiccup on cold start)
      // must not be cached forever — clear it so the next call retries
      // instead of immediately re-rejecting with the same stale error.
    }).catch((error) => {
      signInPromise = null;
      throw error;
    });
  }
  return signInPromise;
}
