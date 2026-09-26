import type { BottomTabBarButtonProps } from "expo-router/js-tabs";
import { View } from "react-native";

import { PressScale } from "@/components/PressScale";

// A soft pill highlights the focused tab's icon+label, and every tab gets
// the same tap-scale feedback as the rest of the app (PressScale) — the
// stock tab bar button only changes tint color, no touch or focus feedback.
export function AppTabButton({
  children,
  style,
  onPress,
  accessibilityState,
  ...rest
}: BottomTabBarButtonProps) {
  const focused = accessibilityState?.selected ?? false;

  return (
    <PressScale
      onPress={onPress}
      accessibilityState={accessibilityState}
      scaleTo={0.9}
      style={[style, { alignItems: "center", justifyContent: "center" }]}
      {...rest}
    >
      <View className={`items-center rounded-2xl px-1 py-0.5 ${focused ? "bg-primary/15" : ""}`}>
        {children}
      </View>
    </PressScale>
  );
}
