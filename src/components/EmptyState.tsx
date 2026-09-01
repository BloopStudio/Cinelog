import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text, View } from "react-native";

interface EmptyStateProps {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  message: string;
}

export function EmptyState({ icon, title, message }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-10">
      <Ionicons name={icon} size={48} color="#4A5568" />
      <Text className="mt-4 text-center text-lg font-semibold text-text-primary">{title}</Text>
      <Text className="mt-2 text-center text-sm text-text-secondary">{message}</Text>
    </View>
  );
}
