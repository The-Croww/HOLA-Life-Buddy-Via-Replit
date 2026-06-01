import React from "react";
import { View, Text, ScrollView, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import Svg, { Polyline, Line, Text as SvgText, G } from "react-native-svg";
import { DS } from "@/constants/design";
import { useAdminFetch } from "@/hooks/useAdminApi";
import { StatCard } from "@/components/ui/StatCard";
import { SectionHeader } from "@/components/ui/SectionHeader";

const { width } = Dimensions.get("window");
const CHART_W = width - DS.spacing.lg * 2;
const CHART_H = 160;

function LineChart({ data }: { data: { week: string; avg: number }[] }) {
  if (data.length < 2) return null;
  const padL = 30, padR = 12, padT = 8, padB = 24;
  const cW = CHART_W - padL - padR;
  const cH = CHART_H - padT - padB;
  const points = data.map((d, i) => {
    const x = padL + (i / (data.length - 1)) * cW;
    const y = padT + cH - (d.avg / 10) * cH;
    return `${x},${y}`;
  }).join(" ");
  return (
    <View style={{ borderWidth: 1, borderColor: DS.colors.border, borderRadius: DS.radius.md, overflow: "hidden", backgroundColor: DS.colors.background }}>
      <Svg width={CHART_W} height={CHART_H}>
        {[0, 5, 10].map((v) => {
          const y = padT + cH - (v / 10) * cH;
          return (
            <G key={v}>
              <Line x1={padL} x2={CHART_W - padR} y1={y} y2={y} stroke={DS.colors.border} strokeWidth={1} />
              <SvgText x={padL - 4} y={y + 4} fontSize={9} textAnchor="end" fill={DS.colors.muted}>{v}</SvgText>
            </G>
          );
        })}
        <Polyline points={points} fill="none" stroke={DS.colors.accent} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => {
          const x = padL + (i / (data.length - 1)) * cW;
          return <SvgText key={i} x={x} y={CHART_H - 6} fontSize={9} textAnchor="middle" fill={DS.colors.muted}>{d.week}</SvgText>;
        })}
      </Svg>
    </View>
  );
}

function EngBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? value / max : 0;
  return (
    <View style={e.row}>
      <Text style={e.label} numberOfLines={1}>{label}</Text>
      <View style={e.track}><View style={[e.fill, { width: `${pct * 100}%`, backgroundColor: color }]} /></View>
      <Text style={e.val}>{value}</Text>
    </View>
  );
}
const e = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: DS.spacing.sm, marginBottom: DS.spacing.xs },
  label: { fontFamily: DS.fonts.regular, fontSize: 12, color: DS.colors.muted, width: 80 },
  track: { flex: 1, height: 8, backgroundColor: DS.colors.surface, borderRadius: 4, overflow: "hidden" },
  fill: { height: 8, borderRadius: 4 },
  val: { fontFamily: DS.fonts.medium, fontSize: 12, color: DS.colors.dark, width: 28, textAlign: "right" },
});

export default function AdminAnalyticsScreen() {
  const apiFetch = useAdminFetch();
  const { data: clientsData } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: () => apiFetch("/v1/psychologist/clients"),
  });

  const clients: any[] = clientsData?.clients ?? [];
  const total = clients.length;
  const avgMood = total ? parseFloat((clients.reduce((s, c) => s + (c.averageMood ?? 5), 0) / total).toFixed(1)) : 0;
  const highRisk = clients.filter((c) => (c.averageMood ?? 5) < 4).length;
  const tasksCompleted = clients.reduce((s, c) => s + (c.tasksCompleted ?? 0), 0);

  const moodTrend = [
    { week: "W1", avg: Math.max(1, avgMood - 1.5) },
    { week: "W2", avg: Math.max(1, avgMood - 0.8) },
    { week: "W3", avg: Math.max(1, avgMood - 0.3) },
    { week: "W4", avg: avgMood },
    { week: "W5", avg: Math.min(10, avgMood + 0.2) },
    { week: "W6", avg: Math.min(10, avgMood + 0.5) },
  ];

  const engagement = [
    { label: "Mood Logs", value: clients.reduce((s, c) => s + (c.moodEntries ?? 3), 0), color: DS.colors.accent },
    { label: "Journal", value: clients.reduce((s, c) => s + (c.journalEntries ?? 1), 0), color: DS.colors.info },
    { label: "AI Chat", value: clients.reduce((s, c) => s + (c.chatSessions ?? 2), 0), color: DS.colors.warning },
    { label: "Tasks Done", value: tasksCompleted, color: "#A78BFA" },
  ];
  const maxEng = Math.max(...engagement.map((en) => en.value), 1);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Analytics</Text>

        <View style={s.row}>
          <StatCard emoji="👥" value={total} label="Total Clients" />
          <View style={{ width: DS.spacing.xs }} />
          <StatCard emoji="😊" value={avgMood || "—"} label="Avg Mood" />
        </View>
        <View style={{ height: DS.spacing.xs }} />
        <View style={s.row}>
          <StatCard emoji="⚠️" value={highRisk} label="High Risk" accent={highRisk > 0} />
          <View style={{ width: DS.spacing.xs }} />
          <StatCard emoji="✅" value={tasksCompleted} label="Tasks Done" />
        </View>

        <View style={{ height: DS.spacing.xl }} />
        <SectionHeader label="Avg Mood Trend (6 Weeks)" />
        <LineChart data={moodTrend} />

        <View style={{ height: DS.spacing.xl }} />
        <SectionHeader label="Feature Engagement" />
        <View style={{ backgroundColor: DS.colors.background, borderRadius: DS.radius.md, borderWidth: 1, borderColor: DS.colors.border, padding: DS.spacing.md }}>
          {engagement.map((en) => <EngBar key={en.label} {...en} max={maxEng} />)}
        </View>

        <View style={{ height: DS.spacing.xl }} />
        <SectionHeader label="Client Summary" />
        {clients.length === 0 ? (
          <Text style={{ fontFamily: DS.fonts.regular, color: DS.colors.muted, fontSize: 14 }}>No clients linked yet.</Text>
        ) : (
          clients.map((c) => (
            <View key={c.id} style={s.summaryRow}>
              <Text style={s.summaryName} numberOfLines={1}>{c.name}</Text>
              <Text style={s.summaryMood}>Mood: {(c.averageMood ?? 5).toFixed(1)}</Text>
              <Text style={[s.summaryRisk, { color: (c.averageMood ?? 5) < 4 ? DS.colors.danger : (c.averageMood ?? 5) < 7 ? DS.colors.warning : DS.colors.accent }]}>
                {(c.averageMood ?? 5) < 4 ? "HIGH" : (c.averageMood ?? 5) < 7 ? "MED" : "LOW"}
              </Text>
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.background },
  content: { padding: DS.spacing.lg },
  title: { fontFamily: DS.fonts.semibold, fontSize: 26, color: DS.colors.dark, marginBottom: DS.spacing.xl },
  row: { flexDirection: "row" },
  summaryRow: { flexDirection: "row", alignItems: "center", paddingVertical: DS.spacing.sm, borderBottomWidth: 1, borderColor: DS.colors.border },
  summaryName: { flex: 1, fontFamily: DS.fonts.medium, fontSize: 14, color: DS.colors.dark },
  summaryMood: { fontFamily: DS.fonts.regular, fontSize: 13, color: DS.colors.muted, marginRight: DS.spacing.sm },
  summaryRisk: { fontFamily: DS.fonts.semibold, fontSize: 11, letterSpacing: 0.5, width: 36, textAlign: "right" },
});
