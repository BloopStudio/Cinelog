import "@/global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ToastProvider } from "@/context/ToastContext";
import { WatchlistProvider } from "@/context/WatchlistContext";

export default function RootLayout() {
  useEffect(() => {
    // The Android nav bar is configured transparent (Expo's default), so
    // any screen area we don't explicitly paint dark shows this native
    // window background straight through — white by default. Setting it
    // once here means a layout gap is always dark, never a white flash.
    SystemUI.setBackgroundColorAsync("#0B0F14");
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <WatchlistProvider>
          <ToastProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="details/[mediaType]/[id]"
                options={{ headerShown: true, headerTitle: "", headerTransparent: true }}
              />
              <Stack.Screen
                name="actor/[id]"
                options={{
                  headerShown: true,
                  headerTitle: "",
                  headerStyle: { backgroundColor: "#0B0F14" },
                  headerTintColor: "#F5F7FA",
                }}
              />
              <Stack.Screen
                name="share"
                options={{
                  headerShown: true,
                  headerTitle: "",
                  headerStyle: { backgroundColor: "#0B0F14" },
                  headerTintColor: "#F5F7FA",
                }}
              />
            </Stack>
          </ToastProvider>
        </WatchlistProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
