import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DS } from "@/constants/design";

interface Props {
  emoji: string;
  value: string | number;
  label: string;
  accent?: boolean;
}

export function StatCard({ emoji, value, label, accent }: Props) {
  return (
    <View style={[s.card, accent && s.accentCard]}>
      <Text style={s.emoji}>{emoji}</Text>
      <Text style={[s.value, accent && s.accentValue]}>{value}</Text>
      <Text style={[s.label, accent && s.accentLabel]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: DS.colors.background,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: DS.colors.border,
    padding: DS.spacing.md,
    alignItems: "center",
  },
  accentCard: { backgroundColor: DS.colors.accent, borderColor: DS.colors.accent },
  emoji: { fontSize: 22, marginBottom: DS.spacing.xs },
  value: { fontFamily: DS.fonts.semibold, fontSize: 22, color: DS.colors.dark, marginBottom: 2 },
  accentValue: { color: DS.colors.white },
  label: { fontFamily: DS.fonts.regular, fontSize: 11, color: DS.colors.muted, textAlign: "center" },
  accentLabel: { color: DS.colors.white + "CC" },
});
