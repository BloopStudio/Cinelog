import "@/global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { WatchlistProvider } from "@/context/WatchlistContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <WatchlistProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="details/[mediaType]/[id]"
              options={{ headerShown: true, headerTitle: "", headerTransparent: true }}
            />
          </Stack>
        </WatchlistProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
