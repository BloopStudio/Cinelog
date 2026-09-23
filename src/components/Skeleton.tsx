import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface SkeletonBlockProps {
  width: number | `${number}%`;
  height: number;
  className?: string;
  style?: object;
}

// A single pulsing placeholder rectangle. Used to build skeleton
// silhouettes of the real content while it's still loading.
function SkeletonBlock({ width, height, className, style }: SkeletonBlockProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      className={`rounded-lg bg-surface-alt ${className ?? ""}`}
      style={[{ width, height }, animatedStyle, style]}
    />
  );
}

export function SkeletonPosterTile({ width = 112 }: { width?: number }) {
  return (
    <View style={{ width }}>
      <SkeletonBlock width={width} height={width * 1.5} className="rounded-xl" />
      <SkeletonBlock width="85%" height={12} style={{ marginTop: 8 }} />
      <SkeletonBlock width="45%" height={10} style={{ marginTop: 5 }} />
    </View>
  );
}

export function SkeletonMovieCard() {
  return (
    <View className="mb-3 flex-row overflow-hidden rounded-2xl bg-surface">
      <SkeletonBlock width={84} height={126} className="rounded-none" />
      <View className="flex-1 justify-between p-3">
        <View className="gap-2">
          <SkeletonBlock width="80%" height={14} />
          <SkeletonBlock width="40%" height={12} />
        </View>
        <SkeletonBlock width="30%" height={12} />
      </View>
    </View>
  );
}
