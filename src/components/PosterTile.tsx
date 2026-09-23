import { Image } from "expo-image";
import { Pressable, Text } from "react-native";
import Animated, { FadeOut, ZoomIn } from "react-native-reanimated";

import { posterTransition } from "@/constants/sharedTransitions";
import { posterUrl } from "@/services/tmdb";

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface PosterTileProps {
  title: string;
  posterPath: string | null;
  subtitle?: string;
  onPress: () => void;
  width?: number;
  // Matches the tag on the details screen's own poster — when the two
  // screens are part of the same push/pop, reanimated grows this poster
  // in place into the detail screen's instead of a hard cut.
  transitionTag?: string;
}

export function PosterTile({
  title,
  posterPath,
  subtitle,
  onPress,
  width = 112,
  transitionTag,
}: PosterTileProps) {
  return (
    <Animated.View
      entering={ZoomIn.duration(250)}
      exiting={FadeOut.duration(200)}
      style={{ width }}
    >
      <Pressable onPress={onPress} className="active:opacity-80">
        <AnimatedImage
          source={posterUrl(posterPath) ?? undefined}
          sharedTransitionTag={transitionTag}
          sharedTransitionStyle={posterTransition}
          // Plain style, not className: nativewind's interop registration
          // for expo-image's Image is not guaranteed to survive being
          // wrapped by Animated.createAnimatedComponent.
          style={{
            width,
            height: width * 1.5,
            borderRadius: 12,
            backgroundColor: "#1E2630",
          }}
          contentFit="cover"
          transition={150}
        />
        <Text numberOfLines={2} className="mt-1.5 text-xs font-semibold text-text-primary">
          {title}
        </Text>
        {subtitle ? <Text className="text-[11px] text-text-secondary">{subtitle}</Text> : null}
      </Pressable>
    </Animated.View>
  );
}
