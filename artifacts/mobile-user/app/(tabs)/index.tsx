import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import {
  useGetMe,
  useGetDailyAffirmation,
  useGetTodayMood,
  useCreateMoodEntry,
  useGetMyTasks,
  useCompleteTask,
} from "@workspace/api-client-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { CustomDrawer } from "@/components/CustomDrawer";
import { useStreak } from "@/hooks/useStreak";
import { useAchievements } from "@/hooks/useAchievements";

const QUICK_MOOD = [
  { score: 2, emoji: "😞", label: "Rough" },
  { score: 4, emoji: "😕", label: "Low" },
  { score: 5, emoji: "😐", label: "Okay" },
  { score: 7, emoji: "🙂", label: "Good" },
  { score: 9, emoji: "😊", label: "Great" },
];

const QUICK_ACTIONS = [
  { label: "Journal", icon: "book-open" as const, color: "#6366f1", route: "/(tabs)/journal" as const },
  { label: "Breathe", icon: "wind" as const, color: "#3DD68C", route: "/(tabs)/mindfulness" as const, tab: "breathe" },
  { label: "Chat", icon: "message-circle" as const, color: "#E1306C", route: "/(tabs)/chat" as const },
  { label: "Progress", icon: "award" as const, color: "#F59E0B", route: "/achievements" as const },
];

const MOOD_LABELS: Record<number, string> = {
  1: "Very low", 2: "Low", 3: "Below average", 4: "A bit low",
  5: "Okay", 6: "Decent", 7: "Good", 8: "Great", 9: "Excellent", 10: "Amazing",
};
const MOOD_EMOJIS: Record<number, string> = {
  1: "😔", 2: "😞", 3: "😕", 4: "😐", 5: "😶",
  6: "🙂", 7: "😊", 8: "😄", 9: "🤩", 10: "🥳",
};

function CelebrationOverlay({ onDone }: { onDone: () => void }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 160 }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]),
      Animated.delay(900),
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.15, duration: 150, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]),
    ]).start(() => onDone());
  }, []);

  return (
    <Animated.View
      style={[
        styles.celebrationOverlay,
        { transform: [{ scale }], opacity },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.celebrationEmoji}>✅</Text>
      <Text style={styles.celebrationText}>Done!</Text>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user: localUser } = useAuth();
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [celebratingTaskId, setCelebratingTaskId] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const { data: me } = useGetMe({ query: { enabled: true } });
  const { data: affirmation } = useGetDailyAffirmation({ query: { enabled: true } });
  const { data: todayMood } = useGetTodayMood({ query: { enabled: true } });
  const { data: tasksData } = useGetMyTasks({ query: { enabled: true } });

  const { currentStreak, weeklyCount, weeklyGoal, loggedToday, recordToday } = useStreak();
  const { newlyUnlocked, clearToast, unlock } = useAchievements();

  const { data: appointmentData } = useQuery({
    queryKey: ["upcoming-appointment"],
    queryFn: async () => {
      const base = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;
      const token = (localUser as any)?.token;
      if (!token) return null;
      const r = await fetch(`${base}/v1/appointments/upcoming`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) return null;
      return r.json();
    },
    enabled: !!localUser,
    staleTime: 5 * 60 * 1000,
  });
  const upcomingAppt = appointmentData?.appointment ?? null;
  const apptHoursAway =
    upcomingAppt
      ? Math.round((new Date(upcomingAppt.dateTime).getTime() - Date.now()) / 3600000)
      : null;

  const toastAnim = useRef(new Animated.Value(-80)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (newlyUnlocked) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(toastAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
          Animated.timing(toastOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        ]),
        Animated.delay(2800),
        Animated.parallel([
          Animated.timing(toastAnim, { toValue: -80, duration: 300, useNativeDriver: true }),
          Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ]).start(() => clearToast());
    }
  }, [newlyUnlocked]);

  const { mutate: logMood } = useCreateMoodEntry({
    mutation: {
      onSuccess: async () => {
        const result = await recordToday();
        if (result.wasNew) {
          if (result.newStreak >= 7) await unlock("week_warrior");
          if (result.newStreak >= 30) await unlock("legend");
          await unlock("first_log");
        }
        router.push("/(tabs)/mood");
      },
    },
  });

  const { mutate: completeTask } = useCompleteTask({
    mutation: {
      onSuccess: (_data: unknown, vars: any) => {
        const taskId = (vars as any).taskId ?? (vars as any).pathParams?.taskId;
        if (taskId) setCelebratingTaskId(taskId);
        setTimeout(() => {
          queryClient.invalidateQueries();
          setCelebratingTaskId(null);
        }, 1400);
      },
    },
  });

  const displayName = me?.name ?? localUser?.name ?? "Friend";
  const hasTodayMood = todayMood?.entry != null;
  const moodScore = todayMood?.entry?.moodScore ?? 5;
  const pendingTasks = (tasksData?.tasks ?? []).filter((t: any) => !t.completedAt);
  const weekPct = Math.min(1, weeklyCount / Math.max(weeklyGoal, 1));

  const handleQuickMood = (score: number) => {
    logMood({ data: { moodScore: score, emotions: [] } });
  };

  return (
    <>
      <CustomDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {newlyUnlocked && (
        <Animated.View
          style={[
            styles.toast,
            { backgroundColor: colors.card, borderColor: colors.calm },
            { transform: [{ translateY: toastAnim }], opacity: toastOpacity },
          ]}
        >
          <Text style={{ fontSize: 22 }}>{newlyUnlocked.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.toastTitle, { color: colors.foreground }]}>
              Achievement unlocked!
            </Text>
            <Text style={[styles.toastSub, { color: colors.mutedForeground }]}>
              {newlyUnlocked.title}
            </Text>
          </View>
          <Feather name="award" size={18} color={colors.calm} />
        </Animated.View>
      )}

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[
          styles.container,
          { paddingTop: topPad + 12, paddingBottom: bottomPad + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => setDrawerOpen(true)}
            style={styles.hamburgerBtn}
          >
            <Feather name="menu" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/achievements")}
            style={styles.streakPill}
          >
            <Text style={styles.streakFire}>🔥</Text>
            <Text style={[styles.streakNum, { color: colors.foreground }]}>
              {currentStreak}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.greetingBlock}>
          <Text style={[styles.greetingText, { color: colors.foreground }]}>
            HOLA, {displayName.split(" ")[0]}!
          </Text>
          <Text style={[styles.greetingSub, { color: colors.mutedForeground }]}>
            {hasTodayMood
              ? "You're all checked in for today 🌿"
              : "How are you doing today?"}
          </Text>
        </View>

        {/* Check-in / Mood Card */}
        {hasTodayMood ? (
          <LinearGradient
            colors={["#0a0a0a", "#111827"]}
            style={styles.moodLoggedCard}
          >
            <View style={styles.moodLoggedTop}>
              <Text style={{ fontSize: 32 }}>
                {MOOD_EMOJIS[Math.round(moodScore)] ?? "😊"}
              </Text>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.moodLoggedLabel}>Today's mood</Text>
                <Text style={styles.moodLoggedScore}>
                  {moodScore}/10 · {MOOD_LABELS[Math.round(moodScore)] ?? "Good"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/mood")}
                style={styles.moodDetailBtn}
              >
                <Text style={styles.moodDetailText}>Details</Text>
                <Feather
                  name="chevron-right"
                  size={14}
                  color="rgba(255,255,255,0.6)"
                />
              </TouchableOpacity>
            </View>
            {weeklyGoal > 0 && (
              <View style={{ gap: 6 }}>
                <View
                  style={{ flexDirection: "row", justifyContent: "space-between" }}
                >
                  <Text style={styles.weeklyLabel}>Weekly goal</Text>
                  <Text style={styles.weeklyLabel}>
                    {weeklyCount}/{weeklyGoal} days
                  </Text>
                </View>
                <View style={styles.weeklyTrack}>
                  <View
                    style={[styles.weeklyFill, { width: `${weekPct * 100}%` }]}
                  />
                </View>
              </View>
            )}
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Quick check-in
            </Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              Tap an emoji to log your mood
            </Text>
            <View style={styles.moodStrip}>
              {QUICK_MOOD.map((item) => (
                <TouchableOpacity
                  key={item.score}
                  style={styles.moodBtn}
                  onPress={() => handleQuickMood(item.score)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.moodEmoji}>{item.emoji}</Text>
                  <Text style={[styles.moodLabel, { color: colors.mutedForeground }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Upcoming appointment reminder */}
        {upcomingAppt &&
          apptHoursAway !== null &&
          apptHoursAway <= 24 &&
          apptHoursAway >= 0 && (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: "#F59E0B55",
                  borderWidth: 1.5,
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    backgroundColor: "#F59E0B22",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="calendar" size={18} color="#F59E0B" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                    Session reminder
                  </Text>
                  <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
                    {upcomingAppt.sessionType === "initial"
                      ? "Initial session"
                      : upcomingAppt.sessionType === "crisis"
                        ? "Crisis session"
                        : "Follow-up session"}{" "}
                    in{" "}
                    {apptHoursAway === 0 ? "< 1 hour" : `${apptHoursAway}h`}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: "#F59E0B22",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: "Inter_700Bold",
                      color: "#F59E0B",
                    }}
                  >
                    {new Date(upcomingAppt.dateTime).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>
            </View>
          )}

        {/* Daily affirmation */}
        {affirmation && (
          <LinearGradient
            colors={["#0f2027", "#203a43"]}
            style={styles.affirmationCard}
          >
            <View style={styles.affirmationHeader}>
              <Feather name="sun" size={13} color="#F77737" />
              <Text style={[styles.affirmationLabel, { color: "#F77737" }]}>
                Daily affirmation
              </Text>
            </View>
            <Text style={styles.affirmationText}>"{affirmation.text}"</Text>
          </LinearGradient>
        )}

        {/* Assigned tasks */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            My tasks
          </Text>
          {pendingTasks.length === 0 && (
            <View style={[styles.emptyTasksCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.emptyTasksEmoji}>📋</Text>
              <Text style={[styles.emptyTasksTitle, { color: colors.foreground }]}>No tasks assigned yet</Text>
              <Text style={[styles.emptyTasksSub, { color: colors.mutedForeground }]}>
                Your psychologist will send tasks here.
              </Text>
            </View>
          )}
          {pendingTasks.length > 0 && pendingTasks.map((task: any) => (
              <View
                key={task.id}
                style={[
                  styles.taskCard,
                  {
                    backgroundColor: colors.card,
                    borderColor:
                      celebratingTaskId === task.id
                        ? colors.calm
                        : colors.calm + "44",
                  },
                ]}
              >
                {celebratingTaskId === task.id && (
                  <CelebrationOverlay onDone={() => {}} />
                )}
                <View style={styles.taskHeader}>
                  <View
                    style={[
                      styles.taskIconWrap,
                      { backgroundColor: colors.calm + "22" },
                    ]}
                  >
                    <Feather
                      name={
                        celebratingTaskId === task.id ? "check-circle" : "clipboard"
                      }
                      size={15}
                      color={colors.calm}
                    />
                  </View>
                  <View style={styles.taskBody}>
                    <Text style={[styles.taskTitle, { color: colors.foreground }]}>
                      {task.title}
                    </Text>
                    {!!task.description && (
                      <Text
                        style={[
                          styles.taskDesc,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {task.description}
                      </Text>
                    )}
                    {task.dueDate && (
                      <Text
                        style={[styles.taskDue, { color: colors.mutedForeground }]}
                      >
                        Due{" "}
                        {new Date(task.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.completeBtn,
                    {
                      borderColor:
                        celebratingTaskId === task.id
                          ? colors.calm
                          : colors.calm,
                      backgroundColor:
                        celebratingTaskId === task.id
                          ? colors.calm + "22"
                          : "transparent",
                    },
                  ]}
                  onPress={() => completeTask({ taskId: task.id })}
                  activeOpacity={0.75}
                  disabled={celebratingTaskId === task.id}
                >
                  <Feather
                    name="check"
                    size={13}
                    color={colors.calm}
                  />
                  <Text
                    style={[styles.completeBtnText, { color: colors.calm }]}
                  >
                    {celebratingTaskId === task.id ? "Completed! 🎉" : "Mark complete"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

        {/* Quick access */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Quick access
          </Text>
          <View style={styles.grid}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={[
                  styles.gridItem,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  if ("tab" in action && action.tab) {
                    router.push({
                      pathname: action.route as any,
                      params: { tab: action.tab },
                    });
                  } else {
                    router.push(action.route as any);
                  }
                }}
              >
                <View
                  style={[
                    styles.gridIcon,
                    { backgroundColor: action.color + "18" },
                  ]}
                >
                  <Feather name={action.icon} size={20} color={action.color} />
                </View>
                <Text style={[styles.gridLabel, { color: colors.foreground }]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, gap: 18 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hamburgerBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: "rgba(255,165,0,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,165,0,0.3)",
  },
  streakFire: { fontSize: 15 },
  streakNum: { fontSize: 14, fontFamily: "Inter_700Bold" },
  greetingBlock: { gap: 3 },
  greetingText: { fontSize: 22, fontFamily: "Inter_700Bold" },
  greetingSub: { fontSize: 14, fontFamily: "Inter_400Regular" },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 12 },
  cardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  cardSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  moodStrip: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  moodBtn: { alignItems: "center", gap: 6, flex: 1 },
  moodEmoji: { fontSize: 26 },
  moodLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  moodLoggedCard: { borderRadius: 12, padding: 18, gap: 14 },
  moodLoggedTop: { flexDirection: "row", alignItems: "center" },
  moodLoggedLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
  },
  moodLoggedScore: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    marginTop: 2,
  },
  moodDetailBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  moodDetailText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.6)",
  },
  weeklyLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
  },
  weeklyTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  weeklyFill: { height: 4, borderRadius: 2, backgroundColor: "#3DD68C" },
  affirmationCard: { borderRadius: 12, padding: 18, gap: 10 },
  affirmationHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  affirmationLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  affirmationText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#FFFFFF",
    lineHeight: 24,
    fontStyle: "italic",
  },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  taskCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    overflow: "hidden",
  },
  taskHeader: { flexDirection: "row", gap: 12 },
  taskIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  taskBody: { flex: 1, gap: 3 },
  taskTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  taskDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  taskDue: { fontSize: 11, fontFamily: "Inter_400Regular" },
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
  },
  completeBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridItem: { width: "47.5%", borderRadius: 12, borderWidth: 1, padding: 16, gap: 10 },
  gridIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  gridLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  toast: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    zIndex: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  toastTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  toastSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(61,214,140,0.18)",
    borderRadius: 12,
    gap: 4,
    zIndex: 10,
  },
  celebrationEmoji: { fontSize: 36 },
  celebrationText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#3DD68C",
  },
  emptyTasksCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 6,
  },
  emptyTasksEmoji: { fontSize: 32 },
  emptyTasksTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyTasksSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
