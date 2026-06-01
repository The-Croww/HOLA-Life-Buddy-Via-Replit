import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { DS } from "@/constants/design";

interface Props {
  label: string;
  action?: { text: string; onPress: () => void };
}

export function SectionHeader({ label, action }: Props) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label.toUpperCase()}</Text>
      {action && (
        <TouchableOpacity onPress={action.onPress}>
          <Text style={s.action}>{action.text}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: DS.spacing.sm },
  label: { fontFamily: DS.fonts.semibold, fontSize: 11, color: DS.colors.muted, letterSpacing: 0.8 },
  action: { fontFamily: DS.fonts.medium, fontSize: 13, color: DS.colors.accent },
});
