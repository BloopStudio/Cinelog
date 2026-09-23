import type { ReactNode } from "react";
import { Pressable, type PressableProps } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

const SPRING = { damping: 15, stiffness: 400 };

interface PressScaleProps extends Omit<PressableProps, "children"> {
  children: ReactNode;
  scaleTo?: number;
}

// Wraps a Pressable's visual content in its own Animated.View so each
// instance gets its own shared value — safe to use inside .map(), unlike a
// hook called directly in a loop. className/style stay on the outer
// Pressable (layout, background, padding); this inner view only animates.
export function PressScale({
  children,
  scaleTo = 0.92,
  onPressIn,
  onPressOut,
  ...props
}: PressScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPressIn={(event) => {
        scale.value = withSpring(scaleTo, SPRING);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withSpring(1, SPRING);
        onPressOut?.(event);
      }}
      {...props}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
}
