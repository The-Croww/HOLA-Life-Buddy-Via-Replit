import React, { useCallback, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { DS } from "@/constants/design";
import { useAdminFetch } from "@/hooks/useAdminApi";
import { Avatar } from "@/components/ui/Avatar";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { MoodBadge } from "@/components/ui/MoodBadge";
import { EmptyState } from "@/components/ui/EmptyState";

function computeRisk(avg: number): "low" | "medium" | "high" {
  if (avg >= 7) return "low";
  if (avg >= 4) return "medium";
  return "high";
}

export default function AdminClientsScreen() {
  const apiFetch = useAdminFetch();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: () => apiFetch("/v1/psychologist/clients"),
  });

  const clients = (data?.clients ?? []).filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <Text style={s.title}>Clients</Text>
        <Text style={s.count}>{clients.length} linked</Text>
      </View>

      <View style={s.searchRow}>
        <Feather name="search" size={16} color={DS.colors.muted} style={{ marginRight: 8 }} />
        <TextInput
          style={s.searchInput}
          placeholder="Search clients..."
          placeholderTextColor={DS.colors.border}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={DS.colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DS.colors.accent} />}
      >
        {clients.length === 0 ? (
          <EmptyState
            emoji={search ? "🔍" : "👥"}
            title={search ? "No results" : "No clients linked"}
            subtitle={search ? "Try a different name" : "Generate a link code from the dashboard"}
          />
        ) : (
          clients.map((client: any) => (
            <TouchableOpacity
              key={client.id}
              style={s.card}
              onPress={() => router.push({ pathname: "/client/[id]", params: { id: client.id, name: client.name } })}
              activeOpacity={0.8}
            >
              <Avatar name={client.name} size={48} />
              <View style={s.info}>
                <Text style={s.name}>{client.name}</Text>
                <Text style={s.sub}>{client.email}</Text>
                <Text style={s.sub}>
                  Last check-in:{" "}
                  {client.lastCheckIn ? new Date(client.lastCheckIn).toLocaleDateString() : "Never"}
                </Text>
              </View>
              <View style={s.badges}>
                <MoodBadge score={client.averageMood ?? 5} size="sm" />
                <View style={{ height: 4 }} />
                <RiskBadge risk={computeRisk(client.averageMood ?? 5)} />
              </View>
              <Feather name="chevron-right" size={18} color={DS.colors.border} style={{ marginLeft: 4 }} />
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
  header: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingHorizontal: DS.spacing.lg, paddingTop: DS.spacing.md, paddingBottom: DS.spacing.xs },
  title: { fontFamily: DS.fonts.semibold, fontSize: 26, color: DS.colors.dark },
  count: { fontFamily: DS.fonts.regular, fontSize: 13, color: DS.colors.muted },
  searchRow: { flexDirection: "row", alignItems: "center", marginHorizontal: DS.spacing.lg, marginBottom: DS.spacing.md, backgroundColor: DS.colors.surface, borderRadius: DS.radius.md, borderWidth: 1, borderColor: DS.colors.border, paddingHorizontal: DS.spacing.md, paddingVertical: 10 },
  searchInput: { flex: 1, fontFamily: DS.fonts.regular, fontSize: 15, color: DS.colors.dark },
  scroll: { flex: 1 },
  content: { paddingHorizontal: DS.spacing.lg },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: DS.colors.background, borderRadius: DS.radius.md, borderWidth: 1, borderColor: DS.colors.border, padding: DS.spacing.md, marginBottom: DS.spacing.xs, gap: DS.spacing.sm },
  info: { flex: 1 },
  name: { fontFamily: DS.fonts.medium, fontSize: 15, color: DS.colors.dark, marginBottom: 2 },
  sub: { fontFamily: DS.fonts.regular, fontSize: 12, color: DS.colors.muted },
  badges: { alignItems: "flex-end" },
});
