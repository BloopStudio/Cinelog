import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useWatchlist } from "@/context/WatchlistContext";

const SYNC_LABELS: Record<string, string> = {
  connecting: "Connexion...",
  synced: "Synchronisée",
  error: "Erreur de connexion",
};

export default function ShareScreen() {
  const { sharedListId, syncState, createSharedList, joinSharedList, leaveSharedList } =
    useWatchlist();
  const [joinCode, setJoinCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setError(null);
    setIsCreating(true);
    try {
      await createSharedList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer la liste partagée.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setError(null);
    setIsJoining(true);
    try {
      await joinSharedList(joinCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de rejoindre cette liste.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = () => {
    Alert.alert(
      "Quitter la liste partagée ?",
      "Ta liste redeviendra locale à cet appareil. L'autre téléphone garde son propre accès.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Quitter", style: "destructive", onPress: () => leaveSharedList() },
      ]
    );
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <View className="px-4 pb-2 pt-4">
        <Text className="text-2xl font-bold text-text-primary">Partager ma liste</Text>
        <Text className="text-sm text-text-secondary">
          Synchronise ta liste entre plusieurs téléphones
        </Text>
      </View>

      <View className="gap-4 p-4">
        {sharedListId ? (
          <View className="gap-4 rounded-2xl bg-surface p-4">
            <View>
              <Text className="text-sm text-text-secondary">Code de la liste partagée</Text>
              <Text className="mt-1 text-3xl font-bold tracking-widest text-text-primary">
                {sharedListId}
              </Text>
              <Text className="mt-1 text-xs text-text-secondary">
                {SYNC_LABELS[syncState] ?? syncState}
              </Text>
            </View>

            <Pressable
              onPress={() => Share.share({ message: sharedListId })}
              className="items-center rounded-full bg-primary py-3"
            >
              <Text className="text-sm font-semibold text-white">Partager le code</Text>
            </Pressable>

            <Pressable
              onPress={handleLeave}
              className="items-center rounded-full border border-border py-3"
            >
              <Text className="text-sm font-semibold text-text-secondary">
                Quitter la liste partagée
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View className="gap-3 rounded-2xl bg-surface p-4">
              <Text className="text-base font-semibold text-text-primary">
                Créer une liste partagée
              </Text>
              <Text className="text-sm text-text-secondary">
                Génère un code à donner à l'autre téléphone. Ta liste actuelle sera envoyée dans
                le cloud.
              </Text>
              <Pressable
                onPress={handleCreate}
                disabled={isCreating}
                className="items-center rounded-full bg-primary py-3 disabled:opacity-60"
              >
                {isCreating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-sm font-semibold text-white">Créer un code</Text>
                )}
              </Pressable>
            </View>

            <View className="gap-3 rounded-2xl bg-surface p-4">
              <Text className="text-base font-semibold text-text-primary">
                Rejoindre une liste
              </Text>
              <Text className="text-sm text-text-secondary">
                Entre le code donné par l'autre téléphone. Ta liste locale sera remplacée par la
                liste partagée.
              </Text>
              <TextInput
                value={joinCode}
                onChangeText={setJoinCode}
                placeholder="Ex: X7K2QPAB"
                placeholderTextColor="#9AA5B1"
                autoCapitalize="characters"
                autoCorrect={false}
                className="rounded-xl bg-background px-3 py-2.5 text-base text-text-primary"
              />
              <Pressable
                onPress={handleJoin}
                disabled={isJoining || !joinCode.trim()}
                className="items-center rounded-full border border-accent py-3 disabled:opacity-60"
              >
                {isJoining ? (
                  <ActivityIndicator color="#E63946" />
                ) : (
                  <Text className="text-sm font-semibold text-accent">Rejoindre</Text>
                )}
              </Pressable>
            </View>
          </>
        )}

        {error ? <Text className="text-sm text-primary">{error}</Text> : null}
      </View>
    </SafeAreaView>
  );
}
