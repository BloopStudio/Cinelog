import type { WatchStatus } from "@/types";

export const STATUS_LABELS: Record<WatchStatus, string> = {
  to_watch: "À voir",
  watching: "En cours",
  watched: "Vu",
};

export const STATUS_COLORS: Record<WatchStatus, { bg: string; text: string }> = {
  to_watch: { bg: "bg-accent/20", text: "text-accent" },
  watching: { bg: "bg-primary/20", text: "text-primary" },
  watched: { bg: "bg-success/20", text: "text-success" },
};

export const STATUS_ORDER: WatchStatus[] = ["watching", "to_watch", "watched"];
