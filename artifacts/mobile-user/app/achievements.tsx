import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAchievements } from "@/hooks/useAchievements";
import { useStreak } from "@/hooks/useStreak";

export default function AchievementsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { achievements } = useAchievements();
  const { currentStreak, longestStreak, totalDays, weeklyCount, weeklyGoal } = useStreak();

  const unlocked = achievements.filter((a) => a.unlocked).length;
  const weekPct = Math.min(1, weeklyCount / Math.max(weeklyGoal, 1));

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={[s.header, { paddingTop: Platform.OS === "web" ? 16 : 0 }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.foreground }]}>Progress</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
        <View style={[s.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <StatBox label="Streak" value={`${currentStreak}🔥`} colors={colors} />
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <StatBox label="Best" value={`${longestStreak}d`} colors={colors} />
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <StatBox label="Total Days" value={`${totalDays}`} colors={colors} />
        </View>

        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.cardTop}>
            <Text style={[s.cardTitle, { color: colors.foreground }]}>Weekly goal</Text>
            <Text style={[s.cardSub, { color: colors.mutedForeground }]}>{weeklyCount}/{weeklyGoal} days</Text>
          </View>
          <View style={[s.trackOuter, { backgroundColor: colors.secondary }]}>
            <View style={[s.trackFill, { width: `${weekPct * 100}%`, backgroundColor: colors.calm }]} />
          </View>
          <Text style={[s.goalHint, { color: colors.mutedForeground }]}>
            {weeklyCount >= weeklyGoal ? "🎉 Goal reached this week!" : `Log ${weeklyGoal - weeklyCount} more day${weeklyGoal - weeklyCount !== 1 ? "s" : ""} to reach your goal`}
          </Text>
        </View>

        <Text style={[s.sectionLabel, { color: colors.foreground }]}>
          Achievements · {unlocked}/{achievements.length}
        </Text>

        <View style={s.grid}>
          {achievements.map((ach) => (
            <View
              key={ach.id}
              style={[
                s.badge,
                { backgroundColor: colors.card, borderColor: ach.unlocked ? colors.calm : colors.border },
                ach.unlocked && { borderWidth: 1.5 },
              ]}
            >
              <Text style={[s.badgeEmoji, !ach.unlocked && s.locked]}>{ach.emoji}</Text>
              <Text style={[s.badgeTitle, { color: ach.unlocked ? colors.foreground : colors.mutedForeground }]} numberOfLines={1}>
                {ach.title}
              </Text>
              <Text style={[s.badgeDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                {ach.description}
              </Text>
              {ach.unlocked ? (
                <View style={[s.unlockedPill, { backgroundColor: colors.calm + "20" }]}>
                  <Feather name="check" size={10} color={colors.calm} />
                  <Text style={[s.unlockedText, { color: colors.calm }]}>Unlocked</Text>
                </View>
              ) : (
                <View style={[s.lockedPill, { backgroundColor: colors.secondary }]}>
                  <Feather name="lock" size={10} color={colors.mutedForeground} />
                  <Text style={[s.lockedText, { color: colors.mutedForeground }]}>Locked</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={s.statBox}>
      <Text style={[s.statVal, { color: colors.foreground }]}>{value}</Text>
      <Text style={[s.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  content: { paddingHorizontal: 20, gap: 16 },
  statsRow: { flexDirection: "row", borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 16, gap: 4 },
  statVal: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  divider: { width: 1 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 10 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cardSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  trackOuter: { height: 8, borderRadius: 4, overflow: "hidden" },
  trackFill: { height: 8, borderRadius: 4 },
  goalHint: { fontSize: 12, fontFamily: "Inter_400Regular" },
  sectionLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badge: { width: "47%", borderRadius: 12, borderWidth: 1, padding: 14, gap: 6, alignItems: "flex-start" },
  badgeEmoji: { fontSize: 28 },
  locked: { opacity: 0.35 },
  badgeTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  badgeDesc: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 15 },
  unlockedPill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  unlockedText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  lockedPill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  lockedText: { fontSize: 10, fontFamily: "Inter_500Medium" },
});
