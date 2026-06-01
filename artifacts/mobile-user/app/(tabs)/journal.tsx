import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Switch, Alert, ActivityIndicator,
  FlatList, Platform, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useAdminFetch } from "@/hooks/useAdminApi";
import { useAchievements } from "@/hooks/useAchievements";

const MOOD_TAGS = [
  { id: "happy", emoji: "😊", label: "Happy" },
  { id: "calm", emoji: "😌", label: "Calm" },
  { id: "anxious", emoji: "😰", label: "Anxious" },
  { id: "sad", emoji: "😢", label: "Sad" },
  { id: "grateful", emoji: "🙏", label: "Grateful" },
  { id: "tired", emoji: "😴", label: "Tired" },
];

interface JournalEntry {
  id: string;
  title: string;
  body: string;
  moodTag: string | null;
  isShared: boolean;
  createdAt: string;
}

export default function JournalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const apiFetch = useAdminFetch();
  const qc = useQueryClient();
  const { increment } = useAchievements();
  const [showNew, setShowNew] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ["journal-entries"],
    queryFn: () => apiFetch("/v1/journal"),
  });

  const entries: JournalEntry[] = data?.entries ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const deleteEntry = useCallback(async (id: string) => {
    Alert.alert("Delete entry", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          try {
            await apiFetch(`/v1/journal/${id}`, { method: "DELETE" });
            qc.invalidateQueries({ queryKey: ["journal-entries"] });
          } catch {
            Alert.alert("Error", "Could not delete entry.");
          }
        },
      },
    ]);
  }, [apiFetch, qc]);

  const handleSaved = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ["journal-entries"] });
    await increment("journal_count", [{ count: 3, achievementId: "open_book" }]);
    setShowNew(false);
  }, [qc, increment]);

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.content, { paddingTop: topPad + 16, paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.calm} />}
      >
        <View style={s.headerRow}>
          <View>
            <Text style={[s.heading, { color: colors.foreground }]}>My Journal</Text>
            <Text style={[s.sub, { color: colors.mutedForeground }]}>{entries.length} {entries.length === 1 ? "entry" : "entries"}</Text>
          </View>
          <TouchableOpacity style={[s.newBtn, { backgroundColor: colors.foreground }]} onPress={() => setShowNew(true)} activeOpacity={0.85}>
            <Feather name="plus" size={15} color={colors.background} />
            <Text style={[s.newBtnText, { color: colors.background }]}>New entry</Text>
          </TouchableOpacity>
        </View>

        {entries.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>✍️</Text>
            <Text style={[s.emptyTitle, { color: colors.foreground }]}>No entries yet</Text>
            <Text style={[s.emptySub, { color: colors.mutedForeground }]}>Writing even 2 sentences can help. ✍️</Text>
          <TouchableOpacity
            style={[s.emptyBtn, { backgroundColor: colors.foreground }]}
            onPress={() => setShowNew(true)}
            activeOpacity={0.82}
            accessibilityLabel="Write your first journal entry"
          >
            <Text style={[s.emptyBtnText, { color: colors.background }]}>Write your first entry</Text>
          </TouchableOpacity>
          </View>
        ) : (
          entries.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onLongPress={() => deleteEntry(entry.id)}
              activeOpacity={0.85}
            >
              <View style={s.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.cardTitle, { color: colors.foreground }]} numberOfLines={1}>{entry.title}</Text>
                  <Text style={[s.cardDate, { color: colors.mutedForeground }]}>
                    {new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  {entry.moodTag && (
                    <Text style={{ fontSize: 18 }}>{MOOD_TAGS.find((m) => m.id === entry.moodTag)?.emoji ?? "📝"}</Text>
                  )}
                  <View style={[s.privacyBadge, { backgroundColor: entry.isShared ? colors.calm + "18" : colors.secondary }]}>
                    <Feather name={entry.isShared ? "users" : "lock"} size={11} color={entry.isShared ? colors.calm : colors.mutedForeground} />
                    <Text style={[s.privacyText, { color: entry.isShared ? colors.calm : colors.mutedForeground }]}>
                      {entry.isShared ? "Shared" : "Private"}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={[s.cardBody, { color: colors.mutedForeground }]} numberOfLines={2}>{entry.body}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <NewEntryModal
        visible={showNew}
        colors={colors}
        apiFetch={apiFetch}
        onClose={() => setShowNew(false)}
        onSaved={handleSaved}
      />
    </View>
  );
}

function NewEntryModal({
  visible, colors, apiFetch, onClose, onSaved,
}: {
  visible: boolean;
  colors: ReturnType<typeof useColors>;
  apiFetch: ReturnType<typeof useAdminFetch>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [moodTag, setMoodTag] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchingPrompt, setFetchingPrompt] = useState(false);

  const reset = () => { setTitle(""); setBody(""); setMoodTag(""); setIsShared(false); };

  const handleClose = () => { reset(); onClose(); };

  const getPrompt = async () => {
    setFetchingPrompt(true);
    try {
      const res = await apiFetch(`/v1/journal/prompt${moodTag ? `?mood=${moodTag}` : ""}`);
      if (res?.prompt) setBody((prev) => prev ? prev + "\n\n" + res.prompt : res.prompt);
    } catch {
    } finally {
      setFetchingPrompt(false);
    }
  };

  const save = async () => {
    if (!body.trim()) return;
    setSaving(true);
    try {
      await apiFetch("/v1/journal", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim() || "Untitled",
          body: body.trim(),
          moodTag: moodTag || null,
          isShared,
        }),
      });
      reset();
      onSaved();
    } catch {
      Alert.alert("Error", "Could not save entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[{ flex: 1, backgroundColor: colors.background }]} edges={["top"]}>
        <View style={[nm.header, { borderColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={[nm.cancel, { color: colors.mutedForeground }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[nm.title, { color: colors.foreground }]}>New Entry</Text>
          <TouchableOpacity
            onPress={save}
            disabled={!body.trim() || saving}
            style={{ opacity: !body.trim() || saving ? 0.4 : 1 }}
          >
            {saving ? <ActivityIndicator size="small" color={colors.calm} /> : <Text style={[nm.save, { color: colors.calm }]}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={nm.content} keyboardShouldPersistTaps="handled">
          <TextInput
            style={[nm.titleInput, { color: colors.foreground, borderColor: colors.border }]}
            placeholder="Title (optional)"
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={[nm.label, { color: colors.mutedForeground }]}>How are you feeling?</Text>
          <View style={nm.tagRow}>
            {MOOD_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                style={[nm.tagPill, { borderColor: moodTag === tag.id ? colors.calm : colors.border, backgroundColor: moodTag === tag.id ? colors.calm + "18" : colors.card }]}
                onPress={() => setMoodTag(moodTag === tag.id ? "" : tag.id)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 16 }}>{tag.emoji}</Text>
                <Text style={[nm.tagLabel, { color: moodTag === tag.id ? colors.calm : colors.mutedForeground }]}>{tag.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={nm.promptRow}>
            <Text style={[nm.label, { color: colors.mutedForeground, flex: 1 }]}>Write your entry</Text>
            <TouchableOpacity onPress={getPrompt} disabled={fetchingPrompt} style={nm.promptBtn}>
              {fetchingPrompt
                ? <ActivityIndicator size="small" color={colors.calm} />
                : <><Feather name="zap" size={13} color={colors.calm} /><Text style={[nm.promptBtnText, { color: colors.calm }]}>AI prompt</Text></>
              }
            </TouchableOpacity>
          </View>

          <TextInput
            style={[nm.bodyInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            multiline
            placeholder="Start writing... or tap AI prompt for a suggested question"
            placeholderTextColor={colors.mutedForeground}
            value={body}
            onChangeText={setBody}
            textAlignVertical="top"
          />

          <View style={[nm.shareRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[nm.shareTitle, { color: colors.foreground }]}>Share with psychologist</Text>
              <Text style={[nm.shareSub, { color: colors.mutedForeground }]}>They can see this entry in your profile</Text>
            </View>
            <Switch value={isShared} onValueChange={setIsShared} trackColor={{ true: colors.calm, false: colors.secondary }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 14 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heading: { fontSize: 26, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  newBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  newBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  emptyBtn: { marginTop: 6, paddingVertical: 13, paddingHorizontal: 28, borderRadius: 10, minHeight: 46, justifyContent: "center", alignItems: "center" },
  emptyBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 10 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  cardDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  privacyBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  privacyText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  cardBody: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
});

const nm = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  title: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  cancel: { fontSize: 15, fontFamily: "Inter_400Regular" },
  save: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  content: { padding: 20, gap: 14, paddingBottom: 60 },
  titleInput: { fontSize: 20, fontFamily: "Inter_600SemiBold", borderBottomWidth: 1, paddingBottom: 10 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: -4 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, borderWidth: 1 },
  tagLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  promptRow: { flexDirection: "row", alignItems: "center" },
  promptBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  promptBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  bodyInput: { borderWidth: 1, borderRadius: 12, padding: 14, minHeight: 180, fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 24 },
  shareRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 12, padding: 14 },
  shareTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  shareSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
