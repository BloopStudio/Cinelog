import { Text, View } from "react-native";

import { STATUS_COLORS, STATUS_LABELS } from "@/constants/status";
import type { WatchStatus } from "@/types";

export function StatusBadge({ status }: { status: WatchStatus }) {
  const colors = STATUS_COLORS[status];

  return (
    <View className={`rounded-full px-2.5 py-1 ${colors.bg}`}>
      <Text className={`text-xs font-semibold ${colors.text}`}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}
