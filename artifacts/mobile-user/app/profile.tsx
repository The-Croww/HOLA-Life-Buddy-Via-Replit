import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useGetMe, useGetMoodEntries } from "@workspace/api-client-react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const JOURNAL_STORAGE_KEY = "@hola_journal_entries";

function calcStreak(entries: { createdAt: string }[]): number {
  if (entries.length === 0) return 0;
  const days = new Set(
    entries.map((e) => new Date(e.createdAt).toDateString()),
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (days.has(d.toDateString())) streak++;
    else break;
  }
  return streak;
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user: localUser, signOut } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [journalCount, setJournalCount] = useState(0);

  const { data: me } = useGetMe();
  const { data: moodData } = useGetMoodEntries({ limit: 100 });

  useEffect(() => {
    AsyncStorage.getItem(JOURNAL_STORAGE_KEY)
      .then((raw) => {
        if (raw) setJournalCount(JSON.parse(raw).length);
      })
      .catch(() => {});
  }, []);

  const entries = moodData?.entries ?? [];
  const streak = calcStreak(entries);
  const displayName = me?.name ?? localUser?.name ?? "Friend";
  const displayEmail = me?.email ?? localUser?.email ?? "";
  const memberSince = localUser?.createdAt
    ? new Date(localUser.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Recently";
  const linkedPsychName = (me as any)?.linkedPsychologistName as string | null;
  const isLinked = !!linkedPsychName;

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: signOut },
    ]);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: {
      paddingTop: topPad + 16,
      paddingHorizontal: 20,
      paddingBottom: 120,
      gap: 16,
    },
    heading: {
      fontSize: 26,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
    },
    avatarCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 999,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontSize: 24,
      fontFamily: "Inter_600SemiBold",
      color: colors.primaryForeground,
    },
    nameBlock: { flex: 1 },
    name: {
      fontSize: 17,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
    },
    email: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      marginTop: 2,
    },
    memberBadge: {
      alignSelf: "flex-start",
      marginTop: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: colors.secondary,
    },
    memberText: {
      fontSize: 11,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
    },
    statsRow: { flexDirection: "row", gap: 10 },
    statCard: {
      flex: 1,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: 14,
      alignItems: "center",
      gap: 4,
    },
    statEmoji: { fontSize: 22 },
    statValue: {
      fontSize: 20,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
    },
    statLabel: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      textAlign: "center",
    },
    sectionLabel: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    psychCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isLinked ? colors.calm + "44" : colors.border,
      backgroundColor: colors.card,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    psychAvatar: {
      width: 44,
      height: 44,
      borderRadius: 999,
      backgroundColor: colors.calm + "22",
      alignItems: "center",
      justifyContent: "center",
    },
    psychInfo: { flex: 1 },
    psychName: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
    },
    psychRole: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      marginTop: 2,
    },
    psychBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: isLinked ? colors.calm + "22" : colors.secondary,
    },
    psychBadgeText: {
      fontSize: 11,
      fontFamily: "Inter_500Medium",
      color: isLinked ? colors.calm : colors.mutedForeground,
    },
    menuCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      overflow: "hidden",
    },
    menuRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    menuRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    menuLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    menuLabel: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
    },
    signOutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: colors.alert,
      borderRadius: 8,
      paddingVertical: 14,
    },
    signOutText: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: colors.alert,
    },
    versionText: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      textAlign: "center",
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Profile</Text>

        {/* Avatar card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.nameBlock}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>{displayEmail}</Text>
            <View style={styles.memberBadge}>
              <Text style={styles.memberText}>Member since {memberSince}</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { emoji: "🔥", value: streak, label: "Day streak" },
            { emoji: "📊", value: entries.length, label: "Moods logged" },
            { emoji: "📓", value: journalCount, label: "Journal entries" },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statEmoji}>{s.emoji}</Text>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Psychologist */}
        <Text style={styles.sectionLabel}>Your psychologist</Text>
        <View style={styles.psychCard}>
          <View style={styles.psychAvatar}>
            <Text style={{ fontSize: 20 }}>{isLinked ? "👩‍⚕️" : "🔗"}</Text>
          </View>
          <View style={styles.psychInfo}>
            <Text style={styles.psychName}>
              {isLinked ? linkedPsychName : "Not linked yet"}
            </Text>
            <Text style={styles.psychRole}>
              {isLinked
                ? "Your data is being shared securely"
                : "Go to Settings to link your account"}
            </Text>
          </View>
          <View style={styles.psychBadge}>
            <Text style={styles.psychBadgeText}>
              {isLinked ? "Linked ✓" : "Pending"}
            </Text>
          </View>
        </View>

        {/* Quick menu */}
        <Text style={styles.sectionLabel}>Quick access</Text>
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={[styles.menuRow, styles.menuRowBorder]}
            onPress={() => router.push("/settings")}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Feather
                name="settings"
                size={18}
                color={colors.mutedForeground}
              />
              <Text style={styles.menuLabel}>Settings</Text>
            </View>
            <Feather
              name="chevron-right"
              size={16}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuRow, styles.menuRowBorder]}
            onPress={() => router.push("/messages")}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Feather
                name="message-circle"
                size={18}
                color={colors.mutedForeground}
              />
              <Text style={styles.menuLabel}>Messages from psychologist</Text>
            </View>
            <Feather
              name="chevron-right"
              size={16}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push("/help")}
            activeOpacity={0.7}
          >
            <View style={styles.menuLeft}>
              <Feather
                name="help-circle"
                size={18}
                color={colors.mutedForeground}
              />
              <Text style={styles.menuLabel}>Help & support</Text>
            </View>
            <Feather
              name="chevron-right"
              size={16}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Feather name="log-out" size={16} color={colors.alert} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>HOLA! Life Buddy v1.0.0</Text>
      </ScrollView>
    </View>
  );
}
