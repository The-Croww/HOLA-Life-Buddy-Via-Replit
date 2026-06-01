import React, { useCallback, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { DS } from "@/constants/design";
import { useAdminFetch } from "@/hooks/useAdminApi";
import { StatCard } from "@/components/ui/StatCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Avatar } from "@/components/ui/Avatar";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { MoodBadge } from "@/components/ui/MoodBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/context/AuthContext";

function computeRisk(avg: number): "low" | "medium" | "high" {
  if (avg >= 7) return "low";
  if (avg >= 4) return "medium";
  return "high";
}

export default function AdminDashboard() {
  const apiFetch = useAdminFetch();
  const router = useRouter();
  const { user } = useAuth();
  const baseUrl = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  const { token } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const { data: clientsData, refetch } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: () => apiFetch("/v1/psychologist/clients"),
  });
  const { data: alertsData } = useQuery({
    queryKey: ["admin-alerts"],
    queryFn: () => apiFetch("/v1/psychologist/alerts"),
  });

  const clients = clientsData?.clients ?? [];
  const alerts = alertsData?.alerts ?? [];
  const activeAlerts = alerts.filter((a: any) => !a.reviewed);
  const avgMood = clients.length
    ? (clients.reduce((s: number, c: any) => s + (c.averageMood ?? 5), 0) / clients.length).toFixed(1)
    : "—";

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const generateLinkCode = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/v1/psychologist/link-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      Alert.alert(
        "Link Code Generated",
        `Share this code with your client:\n\n${data.code}\n\nExpires: ${new Date(data.expiresAt).toLocaleString()}`,
        [{ text: "OK" }]
      );
    } catch {
      Alert.alert("Error", "Could not generate link code.");
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DS.colors.accent} />}
      >
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Good morning</Text>
            <Text style={s.name}>{user?.name ?? "Clinician"} 👋</Text>
          </View>
          <TouchableOpacity style={s.linkBtn} onPress={generateLinkCode} activeOpacity={0.85}>
            <Feather name="link" size={15} color={DS.colors.white} />
            <Text style={s.linkBtnText}>Link Code</Text>
          </TouchableOpacity>
        </View>

        <View style={s.statsRow}>
          <StatCard emoji="👥" value={clients.length} label="Clients" />
          <View style={{ width: DS.spacing.xs }} />
          <StatCard emoji="🔔" value={activeAlerts.length} label="Alerts" accent={activeAlerts.length > 0} />
          <View style={{ width: DS.spacing.xs }} />
          <StatCard emoji="😊" value={avgMood} label="Avg Mood" />
        </View>

        <View style={{ height: DS.spacing.lg }} />
        <SectionHeader label="Recent Alerts" action={{ text: "See all", onPress: () => router.push("/(admin)/alerts") }} />
        {activeAlerts.length === 0 ? (
          <EmptyState emoji="✅" title="No active alerts" subtitle="All clients are doing well" />
        ) : (
          activeAlerts.slice(0, 3).map((alert: any) => (
            <TouchableOpacity
              key={alert.id}
              style={[s.alertCard, { borderLeftColor: alert.severity === "high" ? DS.colors.danger : alert.severity === "medium" ? DS.colors.warning : DS.colors.info }]}
              onPress={() => router.push("/(admin)/alerts")}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.alertTitle}>{alert.type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</Text>
                <Text style={s.alertMsg} numberOfLines={1}>{alert.message}</Text>
              </View>
              <View style={[s.dot, { backgroundColor: alert.severity === "high" ? DS.colors.danger : alert.severity === "medium" ? DS.colors.warning : DS.colors.info }]} />
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: DS.spacing.lg }} />
        <SectionHeader label="Clients" action={{ text: "See all", onPress: () => router.push("/(admin)/clients") }} />
        {clients.length === 0 ? (
          <EmptyState emoji="👥" title="No clients linked" subtitle="Generate a link code to invite clients" />
        ) : (
          clients.slice(0, 4).map((client: any) => (
            <TouchableOpacity
              key={client.id}
              style={s.clientRow}
              onPress={() => router.push({ pathname: "/client/[id]", params: { id: client.id, name: client.name } })}
              activeOpacity={0.8}
            >
              <Avatar name={client.name} size={42} />
              <View style={s.clientInfo}>
                <Text style={s.clientName}>{client.name}</Text>
                <Text style={s.clientSub}>Last check-in: {client.lastCheckIn ? new Date(client.lastCheckIn).toLocaleDateString() : "Never"}</Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <MoodBadge score={client.averageMood ?? 5} size="sm" />
                <RiskBadge risk={computeRisk(client.averageMood ?? 5)} />
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.background },
  scroll: { flex: 1 },
  content: { padding: DS.spacing.lg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: DS.spacing.xl },
  greeting: { fontFamily: DS.fonts.regular, fontSize: 13, color: DS.colors.muted },
  name: { fontFamily: DS.fonts.semibold, fontSize: 22, color: DS.colors.dark },
  linkBtn: { flexDirection: "row", alignItems: "center", backgroundColor: DS.colors.dark, borderRadius: DS.radius.md, paddingHorizontal: 14, paddingVertical: 8, gap: 6 },
  linkBtnText: { fontFamily: DS.fonts.medium, fontSize: 13, color: DS.colors.white },
  statsRow: { flexDirection: "row" },
  alertCard: { flexDirection: "row", alignItems: "center", backgroundColor: DS.colors.background, borderRadius: DS.radius.md, borderWidth: 1, borderColor: DS.colors.border, borderLeftWidth: 3, padding: DS.spacing.md, marginBottom: DS.spacing.xs },
  alertTitle: { fontFamily: DS.fonts.medium, fontSize: 14, color: DS.colors.dark, marginBottom: 2 },
  alertMsg: { fontFamily: DS.fonts.regular, fontSize: 12, color: DS.colors.muted },
  dot: { width: 8, height: 8, borderRadius: 4, marginLeft: DS.spacing.sm },
  clientRow: { flexDirection: "row", alignItems: "center", backgroundColor: DS.colors.background, borderRadius: DS.radius.md, borderWidth: 1, borderColor: DS.colors.border, padding: DS.spacing.md, marginBottom: DS.spacing.xs, gap: DS.spacing.sm },
  clientInfo: { flex: 1 },
  clientName: { fontFamily: DS.fonts.medium, fontSize: 15, color: DS.colors.dark },
  clientSub: { fontFamily: DS.fonts.regular, fontSize: 12, color: DS.colors.muted, marginTop: 2 },
});
