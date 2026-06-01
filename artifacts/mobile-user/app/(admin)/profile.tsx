import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Constants from "expo-constants";
import { DS } from "@/constants/design";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import { Divider } from "@/components/ui/Divider";

export default function AdminProfileScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Profile</Text>

        <View style={s.profileCard}>
          <Avatar name={user?.name ?? "?"} size={64} />
          <View style={s.info}>
            <Text style={s.name}>{user?.name ?? "—"}</Text>
            <Text style={s.email}>{user?.email ?? "—"}</Text>
            <View style={s.roleBadge}>
              <Text style={s.roleText}>{(user?.role ?? "psychologist").toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <Divider />

        <View style={s.section}>
          <Text style={s.sectionLabel}>ACCOUNT</Text>
          <InfoRow icon="mail" label="Email" value={user?.email ?? "—"} />
          <InfoRow icon="shield" label="Role" value={user?.role ?? "psychologist"} />
          <InfoRow icon="calendar" label="Member since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"} />
        </View>

        <Divider />

        <View style={s.section}>
          <Text style={s.sectionLabel}>APP</Text>
          <InfoRow icon="info" label="Version" value={Constants.expoConfig?.version ?? "1.0.0"} />
          <InfoRow icon="layers" label="Mode" value="Clinician" />
        </View>

        <Divider />

        <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Feather name="log-out" size={18} color={DS.colors.danger} />
          <Text style={s.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={r.row}>
      <Feather name={icon as any} size={16} color={DS.colors.muted} />
      <Text style={r.label}>{label}</Text>
      <Text style={r.value} numberOfLines={1}>{value}</Text>
    </View>
  );
}
const r = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: DS.spacing.sm, gap: DS.spacing.sm },
  label: { fontFamily: DS.fonts.medium, fontSize: 14, color: DS.colors.dark, flex: 1 },
  value: { fontFamily: DS.fonts.regular, fontSize: 14, color: DS.colors.muted, maxWidth: "50%", textAlign: "right" },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.background },
  content: { padding: DS.spacing.lg, paddingBottom: 100 },
  title: { fontFamily: DS.fonts.semibold, fontSize: 26, color: DS.colors.dark, marginBottom: DS.spacing.xl },
  profileCard: { flexDirection: "row", alignItems: "center", gap: DS.spacing.lg, backgroundColor: DS.colors.surface, borderRadius: DS.radius.lg, borderWidth: 1, borderColor: DS.colors.border, padding: DS.spacing.lg, marginBottom: DS.spacing.md },
  info: { flex: 1 },
  name: { fontFamily: DS.fonts.semibold, fontSize: 20, color: DS.colors.dark, marginBottom: 4 },
  email: { fontFamily: DS.fonts.regular, fontSize: 13, color: DS.colors.muted, marginBottom: DS.spacing.xs },
  roleBadge: { alignSelf: "flex-start", backgroundColor: DS.colors.accent + "20", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: DS.colors.accent },
  roleText: { fontFamily: DS.fonts.semibold, fontSize: 10, color: DS.colors.accent, letterSpacing: 0.8 },
  section: { marginBottom: DS.spacing.xs },
  sectionLabel: { fontFamily: DS.fonts.semibold, fontSize: 11, color: DS.colors.muted, letterSpacing: 0.8, marginBottom: DS.spacing.xs },
  signOutBtn: { flexDirection: "row", alignItems: "center", gap: DS.spacing.sm, paddingVertical: DS.spacing.md, borderRadius: DS.radius.md, borderWidth: 1, borderColor: DS.colors.danger + "40", paddingHorizontal: DS.spacing.md, backgroundColor: DS.colors.danger + "08" },
  signOutText: { fontFamily: DS.fonts.medium, fontSize: 15, color: DS.colors.danger },
});
