import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ToastProps {
  message: string;
  visible: boolean;
}

// Rendered once at the root by ToastProvider and toggled via `visible` —
// kept mounted (rather than conditionally rendered) so the slide-out
// animation gets to play instead of the view vanishing mid-transition.
export function Toast({ message, visible }: ToastProps) {
  const insets = useSafeAreaInsets();

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: 280 });
  }, [visible, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * -40 }],
  }));

  return (
    <View pointerEvents="none" style={[styles.wrapper, { top: insets.top + 8 }]}>
      <Animated.View style={[styles.toast, animatedStyle]}>
        <View style={styles.dot} />
        <Text style={styles.text} numberOfLines={1}>
          {message}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 100,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1E2630",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    maxWidth: "88%",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#3DDC97",
  },
  text: {
    color: "#F5F7FA",
    fontSize: 13,
    fontWeight: "600",
  },
});
