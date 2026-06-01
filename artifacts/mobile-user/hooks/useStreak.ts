import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STREAK_KEY = "hola_streak_data";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastLogDate: string | null;
  totalDays: number;
  weeklyGoal: number;
  weeklyCount: number;
  weekStart: string | null;
}

const DEFAULT: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastLogDate: null,
  totalDays: 0,
  weeklyGoal: 5,
  weeklyCount: 0,
  weekStart: null,
};

function todayStr() {
  return new Date().toISOString().split("T")[0]!;
}
function weekStartStr() {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d.toISOString().split("T")[0]!;
}

export function useStreak() {
  const [data, setData] = useState<StreakData>(DEFAULT);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STREAK_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const recordToday = useCallback(async (): Promise<{ wasNew: boolean; newStreak: number }> => {
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    const prev: StreakData = raw ? JSON.parse(raw) : DEFAULT;
    const today = todayStr();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]!;
    const thisWeek = weekStartStr();

    if (prev.lastLogDate === today) return { wasNew: false, newStreak: prev.currentStreak };

    const newStreak = prev.lastLogDate === yesterday ? prev.currentStreak + 1 : 1;
    const weeklyCount = prev.weekStart === thisWeek ? prev.weeklyCount + 1 : 1;
    const next: StreakData = {
      ...prev,
      currentStreak: newStreak,
      longestStreak: Math.max(prev.longestStreak, newStreak),
      lastLogDate: today,
      totalDays: prev.totalDays + 1,
      weeklyCount,
      weekStart: thisWeek,
    };
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(next));
    setData(next);
    return { wasNew: true, newStreak };
  }, []);

  const setWeeklyGoal = useCallback(async (goal: number) => {
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    const prev: StreakData = raw ? JSON.parse(raw) : DEFAULT;
    const next = { ...prev, weeklyGoal: goal };
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(next));
    setData(next);
  }, []);

  const loggedToday = data.lastLogDate === todayStr();

  return { ...data, loading, loggedToday, recordToday, setWeeklyGoal, reload: load };
}
