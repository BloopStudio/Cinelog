import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const FRAME_COUNT = 6;

interface FilmstripLoaderProps {
  size?: number;
  color?: string;
}

// Drop-in replacement for <ActivityIndicator>: a strip of film frames
// scrolling sideways, echoing a projector reel instead of a generic ring.
// Frames repeat identically, so resetting after exactly 2 pitches loops
// seamlessly — no visible jump.
export function FilmstripLoader({ size = 32, color = "#3A4452" }: FilmstripLoaderProps) {
  const scale = size / 36;
  const frameWidth = 24 * scale;
  const gap = 6 * scale;
  const pitch = frameWidth + gap;
  const maskWidth = 88 * scale;
  const notchSize = 4 * scale;

  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withRepeat(withTiming(-pitch * 2, { duration: 1300, easing: Easing.linear }), -1);
    return () => cancelAnimation(offset);
  }, [offset, pitch]);

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  const showNotches = frameWidth >= 16;

  return (
    <View style={{ width: maskWidth, height: size, overflow: "hidden" }}>
      <Animated.View style={[{ flexDirection: "row", gap }, trackStyle]}>
        {Array.from({ length: FRAME_COUNT }, (_, i) => (
          <View
            key={i}
            style={{
              width: frameWidth,
              height: size,
              borderRadius: size * 0.14,
              backgroundColor: color,
            }}
          >
            {showNotches ? (
              <>
                <View
                  style={[
                    styles.notch,
                    { width: notchSize, height: notchSize, top: notchSize, left: notchSize },
                  ]}
                />
                <View
                  style={[
                    styles.notch,
                    { width: notchSize, height: notchSize, bottom: notchSize, left: notchSize },
                  ]}
                />
              </>
            ) : null}
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  notch: {
    position: "absolute",
    borderRadius: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
});
