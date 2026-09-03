import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  onAuthStateChanged,
  signInAnonymously,
  type User,
  // @ts-expect-error getReactNativePersistence isn't in firebase's published
  // web types, even though Metro correctly resolves the React Native build
  // (with this export) at runtime. Known gap in the firebase package's types.
  getReactNativePersistence,
} from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// initializeAuth throws if called twice on the same app (e.g. Metro Fast
// Refresh re-running this module) — fall back to the already-initialized
// instance instead of crashing.
let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

export { auth };
// React Native's networking layer struggles with Firestore's default gRPC
// streaming (connections can silently hang on some networks/devices) —
// auto-detecting long-polling instead is the standard RN reliability fix.
export const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });

let signInPromise: Promise<User> | null = null;

export function ensureSignedIn(): Promise<User> {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  if (!signInPromise) {
    signInPromise = new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          unsubscribe();
          if (user) {
            resolve(user);
            return;
          }
          signInAnonymously(auth)
            .then((credential) => resolve(credential.user))
            .catch(reject);
        },
        reject
      );
    });
  }
  return signInPromise;
}
