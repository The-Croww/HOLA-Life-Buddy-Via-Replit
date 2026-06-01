import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { moodColor } from "@/constants/design";

interface Props {
  score: number;
  size?: "sm" | "md";
}

export function MoodBadge({ score, size = "md" }: Props) {
  const color = moodColor(score);
  const isSmall = size === "sm";
  return (
    <View style={[s.badge, { backgroundColor: color + "20", borderColor: color }, isSmall && s.small]}>
      <Text style={[s.text, { color }, isSmall && s.smallText]}>{score.toFixed(1)}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  small: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  text: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  smallText: { fontSize: 11 },
});
