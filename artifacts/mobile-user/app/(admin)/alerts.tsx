import React, { useCallback, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { DS, severityColor } from "@/constants/design";
import { useAdminFetch } from "@/hooks/useAdminApi";
import { EmptyState } from "@/components/ui/EmptyState";

const ALERT_LABELS: Record<string, string> = {
  mood_drop: "Mood Drop",
  no_check_in: "No Check-in",
  distress_emotion: "Distress Detected",
  low_mood_streak: "Low Mood Streak",
};

export default function AdminAlertsScreen() {
  const apiFetch = useAdminFetch();
  const router = useRouter();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"active" | "all" | "reviewed">("active");
  const [refreshing, setRefreshing] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ["admin-alerts"],
    queryFn: () => apiFetch("/v1/psychologist/alerts"),
  });

  const allAlerts: any[] = data?.alerts ?? [];
  const filtered = allAlerts.filter((a) => {
    if (filter === "active") return !a.reviewed;
    if (filter === "reviewed") return a.reviewed;
    return true;
  });
  const activeCount = allAlerts.filter((a) => !a.reviewed).length;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const markReviewed = useCallback(async (alertId: string) => {
    try {
      await apiFetch(`/v1/psychologist/alerts/${alertId}/reviewed`, { method: "PATCH" });
      qc.invalidateQueries({ queryKey: ["admin-alerts"] });
    } catch {
      Alert.alert("Error", "Could not mark alert as reviewed.");
    }
  }, [apiFetch, qc]);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Alerts</Text>
          {activeCount > 0 && <Text style={s.sub}>{activeCount} need attention</Text>}
        </View>
        <View style={[s.badge, activeCount === 0 && s.badgeGreen]}>
          <Text style={s.badgeText}>{activeCount}</Text>
        </View>
      </View>

      <View style={s.filterRow}>
        {(["active", "all", "reviewed"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[s.filterBtn, filter === f && s.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DS.colors.accent} />}
      >
        {filtered.length === 0 ? (
          <EmptyState
            emoji={filter === "reviewed" ? "✅" : "🔔"}
            title={filter === "reviewed" ? "No reviewed alerts" : "No active alerts"}
            subtitle={filter === "active" ? "All clear — clients are doing well" : undefined}
          />
        ) : (
          filtered.map((alert: any) => {
            const color = severityColor(alert.severity);
            const label = ALERT_LABELS[alert.type] ?? alert.type;
            return (
              <View key={alert.id} style={[s.card, { borderLeftColor: color }]}>
                <View style={s.cardTop}>
                  <View style={[s.sevBadge, { backgroundColor: color + "18" }]}>
                    <Text style={[s.sevText, { color }]}>{alert.severity?.toUpperCase()}</Text>
                  </View>
                  <Text style={s.time}>{new Date(alert.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={s.alertType}>{label}</Text>
                <Text style={s.alertMsg}>{alert.message}</Text>
                {!alert.reviewed && (
                  <View style={s.cardActions}>
                    <TouchableOpacity
                      style={s.actionBtn}
                      onPress={() => router.push({ pathname: "/client/[id]", params: { id: alert.clientId, name: "Client" } })}
                    >
                      <Feather name="user" size={13} color={DS.colors.dark} />
                      <Text style={s.actionText}>View Client</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.actionBtn, s.reviewBtn]} onPress={() => markReviewed(alert.id)}>
                      <Feather name="check" size={13} color={DS.colors.accent} />
                      <Text style={[s.actionText, { color: DS.colors.accent }]}>Mark Reviewed</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {alert.reviewed && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 }}>
                    <Feather name="check-circle" size={13} color={DS.colors.accent} />
                    <Text style={{ fontFamily: DS.fonts.regular, fontSize: 12, color: DS.colors.accent }}>Reviewed</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: DS.spacing.lg, paddingTop: DS.spacing.md, paddingBottom: DS.spacing.sm },
  title: { fontFamily: DS.fonts.semibold, fontSize: 26, color: DS.colors.dark },
  sub: { fontFamily: DS.fonts.regular, fontSize: 13, color: DS.colors.muted, marginTop: 2 },
  badge: { width: 28, height: 28, borderRadius: 14, backgroundColor: DS.colors.danger, alignItems: "center", justifyContent: "center" },
  badgeGreen: { backgroundColor: DS.colors.accent },
  badgeText: { fontFamily: DS.fonts.semibold, fontSize: 13, color: DS.colors.white },
  filterRow: { flexDirection: "row", paddingHorizontal: DS.spacing.lg, paddingBottom: DS.spacing.md, gap: DS.spacing.xs },
  filterBtn: { paddingHorizontal: DS.spacing.sm, paddingVertical: 6, borderRadius: DS.radius.full, borderWidth: 1, borderColor: DS.colors.border },
  filterBtnActive: { backgroundColor: DS.colors.dark, borderColor: DS.colors.dark },
  filterText: { fontFamily: DS.fonts.medium, fontSize: 13, color: DS.colors.muted },
  filterTextActive: { color: DS.colors.white },
  scroll: { flex: 1 },
  content: { paddingHorizontal: DS.spacing.lg },
  card: { backgroundColor: DS.colors.background, borderRadius: DS.radius.md, borderWidth: 1, borderColor: DS.colors.border, borderLeftWidth: 3, padding: DS.spacing.md, marginBottom: DS.spacing.xs },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: DS.spacing.xs },
  sevBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  sevText: { fontFamily: DS.fonts.semibold, fontSize: 10, letterSpacing: 0.5 },
  time: { fontFamily: DS.fonts.regular, fontSize: 12, color: DS.colors.muted },
  alertType: { fontFamily: DS.fonts.semibold, fontSize: 15, color: DS.colors.dark, marginBottom: 4 },
  alertMsg: { fontFamily: DS.fonts.regular, fontSize: 13, color: DS.colors.muted, lineHeight: 18 },
  cardActions: { flexDirection: "row", gap: DS.spacing.xs, marginTop: DS.spacing.sm },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: DS.spacing.sm, paddingVertical: 6, borderRadius: DS.radius.sm, borderWidth: 1, borderColor: DS.colors.border },
  reviewBtn: { borderColor: DS.colors.accent + "40" },
  actionText: { fontFamily: DS.fonts.medium, fontSize: 12, color: DS.colors.dark },
});
