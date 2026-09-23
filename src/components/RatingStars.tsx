import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { PressScale } from "@/components/PressScale";

interface RatingStarsProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: number;
}

const STAR_COUNT = 5;

export function RatingStars({ rating, onChange, size = 22 }: RatingStarsProps) {
  const stars = Array.from({ length: STAR_COUNT }, (_, index) => index + 1);

  return (
    <View className="flex-row gap-1">
      {stars.map((value) => {
        const filled = value <= rating;
        const half = !filled && value - 0.5 <= rating;
        const star = (
          <Ionicons
            key={value}
            name={filled ? "star" : half ? "star-half" : "star-outline"}
            size={size}
            color={filled || half ? "#F4A340" : "#4A5568"}
          />
        );

        if (!onChange) return star;

        return (
          <PressScale
            key={value}
            hitSlop={6}
            scaleTo={0.8}
            // Tapping the left half of a star sets a .5 rating, the right
            // half sets the whole number — same gesture as any half-star
            // picker, no separate control needed.
            onPress={(event) => {
              const isLeftHalf = event.nativeEvent.locationX < size / 2;
              const tapped = isLeftHalf ? value - 0.5 : value;
              onChange(tapped === rating ? 0 : tapped);
            }}
          >
            {star}
          </PressScale>
        );
      })}
    </View>
  );
}
