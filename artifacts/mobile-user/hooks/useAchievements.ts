import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ACH_KEY = "hola_achievements";

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
}

const DEFINITIONS: Omit<Achievement, "unlocked" | "unlockedAt">[] = [
  { id: "first_log", emoji: "🌱", title: "First Log", description: "Log your first mood entry" },
  { id: "open_book", emoji: "📖", title: "Open Book", description: "Write 3 journal entries" },
  { id: "mindful", emoji: "🧘", title: "Mindful", description: "Complete 5 breathing sessions" },
  { id: "week_warrior", emoji: "🔥", title: "Week Warrior", description: "Maintain a 7-day streak" },
  { id: "connected", emoji: "🤝", title: "Connected", description: "Link with a psychologist" },
  { id: "legend", emoji: "👑", title: "30-Day Legend", description: "Maintain a 30-day streak" },
];

interface AchievementStore {
  unlocked: Record<string, string>;
  counters: Record<string, number>;
}

const DEFAULT_STORE: AchievementStore = { unlocked: {}, counters: {} };

export function useAchievements() {
  const [store, setStore] = useState<AchievementStore>(DEFAULT_STORE);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement | null>(null);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(ACH_KEY);
      if (raw) setStore(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (next: AchievementStore) => {
    await AsyncStorage.setItem(ACH_KEY, JSON.stringify(next));
    setStore(next);
  }, []);

  const unlock = useCallback(async (id: string): Promise<boolean> => {
    const raw = await AsyncStorage.getItem(ACH_KEY);
    const current: AchievementStore = raw ? JSON.parse(raw) : DEFAULT_STORE;
    if (current.unlocked[id]) return false;
    const next = { ...current, unlocked: { ...current.unlocked, [id]: new Date().toISOString() } };
    await save(next);
    const def = DEFINITIONS.find((d) => d.id === id);
    if (def) setNewlyUnlocked({ ...def, unlocked: true, unlockedAt: next.unlocked[id] });
    return true;
  }, [save]);

  const increment = useCallback(async (counter: string, thresholds: { count: number; achievementId: string }[]) => {
    const raw = await AsyncStorage.getItem(ACH_KEY);
    const current: AchievementStore = raw ? JSON.parse(raw) : DEFAULT_STORE;
    const prev = current.counters[counter] ?? 0;
    const next: AchievementStore = {
      ...current,
      counters: { ...current.counters, [counter]: prev + 1 },
    };
    await save(next);
    for (const t of thresholds) {
      if ((prev + 1) >= t.count && !current.unlocked[t.achievementId]) {
        await unlock(t.achievementId);
      }
    }
  }, [save, unlock]);

  const achievements: Achievement[] = DEFINITIONS.map((d) => ({
    ...d,
    unlocked: !!store.unlocked[d.id],
    unlockedAt: store.unlocked[d.id],
  }));

  const clearToast = useCallback(() => setNewlyUnlocked(null), []);

  return { achievements, newlyUnlocked, clearToast, unlock, increment, counters: store.counters, reload: load };
}
