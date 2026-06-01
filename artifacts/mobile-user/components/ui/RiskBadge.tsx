import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { riskColor } from "@/constants/design";

interface Props {
  risk: "low" | "medium" | "high" | string;
}

export function RiskBadge({ risk }: Props) {
  const color = riskColor(risk);
  return (
    <View style={[s.badge, { backgroundColor: color + "18", borderColor: color }]}>
      <Text style={[s.text, { color }]}>{risk.toUpperCase()}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: { fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 0.5 },
});
