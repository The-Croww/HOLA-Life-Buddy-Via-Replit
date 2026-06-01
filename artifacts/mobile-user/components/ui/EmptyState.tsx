import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DS } from "@/constants/design";

interface Props {
  emoji: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ emoji, title, subtitle }: Props) {
  return (
    <View style={s.container}>
      <Text style={s.emoji}>{emoji}</Text>
      <Text style={s.title}>{title}</Text>
      {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", padding: DS.spacing.xxl },
  emoji: { fontSize: 36, marginBottom: DS.spacing.sm },
  title: { fontFamily: DS.fonts.semibold, fontSize: 16, color: DS.colors.dark, marginBottom: DS.spacing.xs, textAlign: "center" },
  subtitle: { fontFamily: DS.fonts.regular, fontSize: 14, color: DS.colors.muted, textAlign: "center", lineHeight: 20 },
});
