import React from "react";
import { View, StyleSheet } from "react-native";
import { DS } from "@/constants/design";

export function Divider() {
  return <View style={s.line} />;
}

const s = StyleSheet.create({
  line: { height: 1, backgroundColor: DS.colors.border, marginVertical: DS.spacing.md },
});
