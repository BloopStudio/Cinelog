import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

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
        const star = (
          <Ionicons
            key={value}
            name={filled ? "star" : "star-outline"}
            size={size}
            color={filled ? "#F4A340" : "#4A5568"}
          />
        );

        if (!onChange) return star;

        return (
          <Pressable
            key={value}
            hitSlop={6}
            onPress={() => onChange(value === rating ? 0 : value)}
          >
            {star}
          </Pressable>
        );
      })}
    </View>
  );
}
