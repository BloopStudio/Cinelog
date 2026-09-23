import { SharedTransition } from "react-native-reanimated";

// Shared by every poster (grid tiles, list rows, the details screen itself)
// so the cross-screen "poster grows in place" transition always plays at
// the same speed, matching the app's other entrance timings (~250-300ms).
export const posterTransition = SharedTransition.duration(320);
