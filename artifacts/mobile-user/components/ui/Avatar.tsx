import React from "react";
import { View, Text, StyleSheet } from "react-native";

const COLORS = ["#3DD68C", "#5B9CF6", "#FFB547", "#FF6B6B", "#A78BFA", "#34D399"];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

interface Props {
  name: string;
  size?: number;
}

export function Avatar({ name, size = 40 }: Props) {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  const bg = colorForName(name);
  return (
    <View style={[s.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[s.initial, { fontSize: size * 0.38 }]}>{initial}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center" },
  initial: { fontFamily: "Inter_600SemiBold", color: "#FFFFFF" },
});
