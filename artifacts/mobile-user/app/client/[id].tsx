import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, Modal, FlatList, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import Svg, { Polyline, Line, Text as SvgText, G, Circle } from "react-native-svg";
import { DS, moodColor } from "@/constants/design";
import { useAdminFetch } from "@/hooks/useAdminApi";
import { Avatar } from "@/components/ui/Avatar";
import { MoodBadge } from "@/components/ui/MoodBadge";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Divider } from "@/components/ui/Divider";

const { width } = Dimensions.get("window");
const CHART_W = width - DS.spacing.lg * 2;
const CHART_H = 140;

const TASK_PRESETS = [
  { title: "Daily Mood Check-in", description: "Log your mood every day for 7 days." },
  { title: "Breathing Exercise", description: "Practice 5 minutes of deep breathing daily." },
  { title: "Gratitude Journal", description: "Write 3 things you're grateful for each day." },
  { title: "Social Connection", description: "Reach out to one friend or family member today." },
  { title: "Mindfulness Walk", description: "Take a 10-minute mindful walk outside." },
  { title: "Sleep Hygiene Routine", description: "Follow a consistent bedtime routine for 5 nights." },
  { title: "Progressive Muscle Relaxation", description: "Practice PMR exercise before bed." },
  { title: "Positive Self-Talk", description: "Identify and reframe one negative thought per day." },
];

const SOAP_FIELDS = [
  { key: "subjective", label: "Subjective", placeholder: "What the client reported…" },
  { key: "objective", label: "Objective", placeholder: "Observable data, mood scores…" },
  { key: "assessment", label: "Assessment", placeholder: "Clinical impressions…" },
  { key: "plan", label: "Plan", placeholder: "Next steps, homework…" },
];
const PROGRESS_FIELDS = [
  { key: "goals", label: "Session goals", placeholder: "Goals for this session…" },
  { key: "covered", label: "What was covered", placeholder: "Topics discussed…" },
  { key: "homework", label: "Homework assigned", placeholder: "Tasks given…" },
  { key: "next", label: "Next session focus", placeholder: "Areas to address next time…" },
];

type Tab = "overview" | "tasks" | "journal" | "notes" | "goals";

export default function ClientDetailScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const router = useRouter();
  const apiFetch = useAdminFetch();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [expandedJournal, setExpandedJournal] = useState<string | null>(null);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  // AI Summary
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Notes
  const [noteTemplate, setNoteTemplate] = useState<"soap" | "progress" | "free">("soap");
  const [noteContent, setNoteContent] = useState<Record<string, string>>({});
  const [noteTitle, setNoteTitle] = useState("Session note");
  const [savingNote, setSavingNote] = useState(false);

  // Goals
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDesc, setGoalDesc] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);
  const [celebratingGoal, setCelebratingGoal] = useState<string | null>(null);

  const { data: moodData } = useQuery({ queryKey: ["client-mood", id], queryFn: () => apiFetch(`/v1/psychologist/clients/${id}/mood`), enabled: !!id });
  const { data: tasksData, refetch: refetchTasks } = useQuery({ queryKey: ["client-tasks", id], queryFn: () => apiFetch(`/v1/psychologist/clients/${id}/tasks`), enabled: !!id });
  const { data: journalData } = useQuery({ queryKey: ["client-journal", id], queryFn: () => apiFetch(`/v1/psychologist/clients/${id}/journal`), enabled: !!id });
  const { data: notesData, refetch: refetchNotes } = useQuery({ queryKey: ["client-notes", id], queryFn: () => apiFetch(`/v1/psychologist/clients/${id}/notes`), enabled: !!id });
  const { data: goalsData, refetch: refetchGoals } = useQuery({ queryKey: ["client-goals", id], queryFn: () => apiFetch(`/v1/psychologist/clients/${id}/goals`), enabled: !!id });

  const moodEntries: any[] = moodData?.entries ?? [];
  const tasks: any[] = tasksData?.tasks ?? [];
  const journalEntries: any[] = journalData?.entries ?? [];
  const savedNotes: any[] = notesData?.notes ?? [];
  const goals: any[] = goalsData?.goals ?? [];

  const avgMood = moodEntries.length ? moodEntries.reduce((s, e) => s + e.moodScore, 0) / moodEntries.length : null;
  const risk = avgMood !== null ? (avgMood >= 7 ? "low" : avgMood >= 4 ? "medium" : "high") : "low";

  const addTask = useCallback(async (preset: (typeof TASK_PRESETS)[0]) => {
    setAddingTask(true);
    try {
      await apiFetch(`/v1/psychologist/clients/${id}/tasks`, {
        method: "POST",
        body: JSON.stringify({ title: preset.title, description: preset.description, dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }),
      });
      await refetchTasks();
      setShowTaskModal(false);
      Alert.alert("Task assigned", `"${preset.title}" has been assigned to ${name}.`);
    } catch { Alert.alert("Error", "Could not assign task."); }
    finally { setAddingTask(false); }
  }, [id, name, apiFetch, refetchTasks]);

  const handleAISummary = async () => {
    setAiLoading(true);
    setShowAiPanel(true);
    try {
      const data = await apiFetch(`/v1/psychologist/clients/${id}/ai-summary`, { method: "POST" });
      setAiSummary(data?.summary ?? null);
    } catch { setAiSummary(null); }
    finally { setAiLoading(false); }
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await apiFetch(`/v1/psychologist/clients/${id}/notes`, {
        method: "POST",
        body: JSON.stringify({ template: noteTemplate, title: noteTitle, content: noteContent }),
      });
      await refetchNotes();
      setNoteContent({});
      setNoteTitle("Session note");
      Alert.alert("Saved", "Note saved successfully.");
    } catch { Alert.alert("Error", "Could not save note."); }
    finally { setSavingNote(false); }
  };

  const handleCreateGoal = async () => {
    if (!goalTitle.trim()) return;
    setSavingGoal(true);
    try {
      await apiFetch(`/v1/psychologist/clients/${id}/goals`, {
        method: "POST",
        body: JSON.stringify({ title: goalTitle, description: goalDesc }),
      });
      await refetchGoals();
      setGoalTitle("");
      setGoalDesc("");
      setShowGoalForm(false);
    } catch { Alert.alert("Error", "Could not create goal."); }
    finally { setSavingGoal(false); }
  };

  const handleGoalStatus = async (goalId: string, status: string) => {
    if (status === "achieved") setCelebratingGoal(goalId);
    try {
      await apiFetch(`/v1/psychologist/clients/${id}/goals/${goalId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await refetchGoals();
      if (status === "achieved") {
        Alert.alert("🎉 Goal achieved!", `Great progress with ${name}!`);
        setTimeout(() => setCelebratingGoal(null), 2000);
      }
    } catch { Alert.alert("Error", "Could not update goal."); }
  };

  const noteFields = noteTemplate === "soap" ? SOAP_FIELDS : noteTemplate === "progress" ? PROGRESS_FIELDS : [];

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={22} color={DS.colors.dark} />
        </TouchableOpacity>
        <View style={s.clientHeader}>
          <Avatar name={name ?? "?"} size={36} />
          <View style={{ marginLeft: DS.spacing.sm }}>
            <Text style={s.clientName}>{name}</Text>
            <Text style={s.clientSub}>Client profile</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleAISummary} style={s.aiBtn}>
          <Feather name="zap" size={13} color="#3DD68C" />
          <Text style={s.aiBtnText}>AI</Text>
        </TouchableOpacity>
        {avgMood !== null && <MoodBadge score={avgMood} size="sm" />}
      </View>

      {/* AI Summary panel */}
      {showAiPanel && (
        <View style={s.aiPanel}>
          <View style={s.aiPanelHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Feather name="zap" size={14} color="#3DD68C" />
              <Text style={s.aiPanelTitle}>AI Clinical Summary</Text>
            </View>
            <TouchableOpacity onPress={() => setShowAiPanel(false)}>
              <Feather name="x" size={16} color={DS.colors.muted} />
            </TouchableOpacity>
          </View>
          {aiLoading ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: DS.spacing.sm }}>
              <ActivityIndicator size="small" color="#3DD68C" />
              <Text style={s.aiPanelText}>Analyzing {name}'s data…</Text>
            </View>
          ) : aiSummary ? (
            <Text style={s.aiPanelText}>{aiSummary}</Text>
          ) : (
            <Text style={s.aiPanelText}>Could not generate summary. Check GROQ_API_KEY.</Text>
          )}
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBarScroll} contentContainerStyle={s.tabBar}>
        {(["overview", "tasks", "journal", "notes", "goals"] as Tab[]).map((tab) => (
          <TouchableOpacity key={tab} style={[s.tabItem, activeTab === tab && s.tabItemActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {activeTab === "overview" && <OverviewTab moodEntries={moodEntries} avgMood={avgMood} risk={risk} />}
        {activeTab === "tasks" && <TasksTab tasks={tasks} onAssign={() => setShowTaskModal(true)} />}
        {activeTab === "journal" && <JournalTab entries={journalEntries} expandedId={expandedJournal} onToggle={(eid) => setExpandedJournal(expandedJournal === eid ? null : eid)} />}

        {activeTab === "notes" && (
          <>
            <SectionHeader label="Session Notes" />
            <View style={s.templateRow}>
              {(["soap", "progress", "free"] as const).map((t) => (
                <TouchableOpacity key={t} style={[s.templateChip, noteTemplate === t && s.templateChipActive]} onPress={() => { setNoteTemplate(t); setNoteContent({}); }}>
                  <Text style={[s.templateChipText, noteTemplate === t && s.templateChipTextActive]}>{t === "soap" ? "SOAP" : t === "progress" ? "Progress" : "Free"}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={s.notesInput} value={noteTitle} onChangeText={setNoteTitle} placeholder="Note title…" placeholderTextColor={DS.colors.border} />
            {noteTemplate === "free" ? (
              <TextInput style={[s.notesInput, { minHeight: 180 }]} multiline value={noteContent.body ?? ""} onChangeText={(t) => setNoteContent({ body: t })} placeholder="Write session notes here…" placeholderTextColor={DS.colors.border} textAlignVertical="top" />
            ) : (
              noteFields.map((f) => (
                <View key={f.key}>
                  <Text style={s.fieldLabel}>{f.label}</Text>
                  <TextInput style={[s.notesInput, { minHeight: 70 }]} multiline value={noteContent[f.key] ?? ""} onChangeText={(t) => setNoteContent((prev) => ({ ...prev, [f.key]: t }))} placeholder={f.placeholder} placeholderTextColor={DS.colors.border} textAlignVertical="top" />
                </View>
              ))
            )}
            <TouchableOpacity style={[s.saveBtn, savingNote && { opacity: 0.6 }]} onPress={handleSaveNote} disabled={savingNote}>
              {savingNote ? <ActivityIndicator size="small" color={DS.colors.white} /> : <><Feather name="save" size={16} color={DS.colors.white} /><Text style={s.saveBtnText}>Save Note</Text></>}
            </TouchableOpacity>
            {savedNotes.length > 0 && (
              <>
                <Divider />
                <SectionHeader label={`Past Notes (${savedNotes.length})`} />
                {savedNotes.map((note: any) => (
                  <TouchableOpacity key={note.id} style={s.noteCard} onPress={() => setExpandedNote(expandedNote === note.id ? null : note.id)} activeOpacity={0.85}>
                    <View style={s.noteCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.noteCardTitle}>{note.title}</Text>
                        <Text style={s.noteCardMeta}>{note.template.toUpperCase()} · {new Date(note.createdAt).toLocaleDateString()}</Text>
                      </View>
                      <Feather name={expandedNote === note.id ? "chevron-up" : "chevron-down"} size={16} color={DS.colors.muted} />
                    </View>
                    {expandedNote === note.id && Object.entries(note.content).map(([key, val]: any) => (
                      <View key={key} style={{ marginTop: DS.spacing.sm }}>
                        <Text style={s.fieldLabel}>{key}</Text>
                        <Text style={{ fontFamily: DS.fonts.regular, fontSize: 13, color: DS.colors.dark, lineHeight: 19 }}>{val}</Text>
                      </View>
                    ))}
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        )}

        {activeTab === "goals" && (
          <>
            <SectionHeader label="Treatment Goals" action={{ text: "Add Goal", onPress: () => setShowGoalForm(true) }} />
            {showGoalForm && (
              <View style={s.goalForm}>
                <TextInput style={s.notesInput} value={goalTitle} onChangeText={setGoalTitle} placeholder="Goal title…" placeholderTextColor={DS.colors.border} />
                <TextInput style={[s.notesInput, { minHeight: 60, marginTop: 8 }]} multiline value={goalDesc} onChangeText={setGoalDesc} placeholder="Description (optional)…" placeholderTextColor={DS.colors.border} textAlignVertical="top" />
                <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowGoalForm(false); setGoalTitle(""); setGoalDesc(""); }}>
                    <Text style={{ fontFamily: DS.fonts.medium, fontSize: 14, color: DS.colors.muted }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.saveBtn, { flex: 1 }, (savingGoal || !goalTitle) && { opacity: 0.5 }]} onPress={handleCreateGoal} disabled={savingGoal || !goalTitle}>
                    {savingGoal ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.saveBtnText}>Create goal</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {goals.length === 0 ? (
              <EmptyState emoji="🎯" title="No goals set" subtitle="Add treatment goals to track therapeutic progress" />
            ) : (
              goals.map((goal: any) => (
                <View key={goal.id} style={[s.goalCard, celebratingGoal === goal.id && { borderColor: "#3DD68C" }, goal.status === "achieved" && { opacity: 0.7 }]}>
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                    <Text style={{ fontSize: 18, marginTop: 1 }}>{goal.status === "achieved" ? "✅" : goal.status === "paused" ? "⏸️" : "🎯"}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.goalTitle, goal.status === "achieved" && { textDecorationLine: "line-through", color: DS.colors.muted }]}>{goal.title}</Text>
                      {goal.description ? <Text style={s.goalDesc}>{goal.description}</Text> : null}
                      <Text style={s.goalMeta}>Added {new Date(goal.createdAt).toLocaleDateString()}{goal.achievedAt ? ` · Achieved ${new Date(goal.achievedAt).toLocaleDateString()} 🎉` : ""}</Text>
                    </View>
                  </View>
                  {goal.status !== "achieved" && (
                    <View style={{ flexDirection: "row", gap: 6, marginTop: 10, paddingLeft: 28 }}>
                      {goal.status === "active" && (
                        <TouchableOpacity style={s.goalActionBtn} onPress={() => handleGoalStatus(goal.id, "paused")}>
                          <Text style={s.goalActionText}>Pause</Text>
                        </TouchableOpacity>
                      )}
                      {goal.status === "paused" && (
                        <TouchableOpacity style={s.goalActionBtn} onPress={() => handleGoalStatus(goal.id, "active")}>
                          <Text style={s.goalActionText}>Resume</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={[s.goalActionBtn, { borderColor: "#3DD68C", backgroundColor: "#3DD68C22" }]} onPress={() => handleGoalStatus(goal.id, "achieved")}>
                        <Text style={[s.goalActionText, { color: "#3DD68C" }]}>✓ Achieved</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={showTaskModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modal} edges={["top"]}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Assign Task</Text>
            <TouchableOpacity onPress={() => setShowTaskModal(false)}>
              <Feather name="x" size={22} color={DS.colors.dark} />
            </TouchableOpacity>
          </View>
          <Text style={s.modalSub}>Choose a preset task to assign to {name}</Text>
          <FlatList
            data={TASK_PRESETS}
            keyExtractor={(t) => t.title}
            contentContainerStyle={{ padding: DS.spacing.lg }}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.presetCard} onPress={() => addTask(item)} disabled={addingTask} activeOpacity={0.8}>
                <View style={{ flex: 1 }}>
                  <Text style={s.presetTitle}>{item.title}</Text>
                  <Text style={s.presetDesc}>{item.description}</Text>
                </View>
                {addingTask ? <ActivityIndicator size="small" color={DS.colors.accent} /> : <Feather name="plus-circle" size={20} color={DS.colors.accent} />}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function OverviewTab({ moodEntries, avgMood, risk }: { moodEntries: any[]; avgMood: number | null; risk: string }) {
  const recent = moodEntries.slice(0, 10).reverse();
  const padL = 28, padR = 12, padT = 8, padB = 24;
  const cW = CHART_W - padL - padR;
  const cH = CHART_H - padT - padB;
  const topEmotions: Record<string, number> = {};
  moodEntries.forEach((e) => (e.emotions ?? []).forEach((em: string) => { topEmotions[em] = (topEmotions[em] ?? 0) + 1; }));
  const sortedEmotions = Object.entries(topEmotions).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return (
    <>
      <View style={s.statRow}>
        <View style={s.statBox}><Text style={s.statVal}>{avgMood !== null ? avgMood.toFixed(1) : "—"}</Text><Text style={s.statLbl}>Avg Mood</Text></View>
        <View style={s.statDivider} />
        <View style={s.statBox}><Text style={s.statVal}>{moodEntries.length}</Text><Text style={s.statLbl}>Check-ins</Text></View>
        <View style={s.statDivider} />
        <View style={s.statBox}><RiskBadge risk={risk} /><Text style={s.statLbl}>Risk</Text></View>
      </View>
      <Divider />
      <SectionHeader label="Mood Trend (Last 10)" />
      {recent.length < 2 ? (
        <EmptyState emoji="📊" title="Not enough data" subtitle="Client needs more check-ins" />
      ) : (
        <View style={{ borderWidth: 1, borderColor: DS.colors.border, borderRadius: DS.radius.md, overflow: "hidden", backgroundColor: DS.colors.background }}>
          <Svg width={CHART_W} height={CHART_H}>
            {[0, 5, 10].map((v) => {
              const y = padT + cH - (v / 10) * cH;
              return <G key={v}><Line x1={padL} x2={CHART_W - padR} y1={y} y2={y} stroke={DS.colors.border} strokeWidth={1} /><SvgText x={padL - 4} y={y + 4} fontSize={9} textAnchor="end" fill={DS.colors.muted}>{v}</SvgText></G>;
            })}
            <Polyline points={recent.map((e, i) => `${padL + (i / (recent.length - 1)) * cW},${padT + cH - (e.moodScore / 10) * cH}`).join(" ")} fill="none" stroke={DS.colors.accent} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            {recent.map((e, i) => <Circle key={i} cx={padL + (i / (recent.length - 1)) * cW} cy={padT + cH - (e.moodScore / 10) * cH} r={4} fill={moodColor(e.moodScore)} />)}
          </Svg>
        </View>
      )}
      {sortedEmotions.length > 0 && (
        <><Divider /><SectionHeader label="Top Emotions" />
          <View style={s.emotionsRow}>
            {sortedEmotions.map(([em, count]) => (
              <View key={em} style={s.emotionChip}><Text style={s.emotionText}>{em}</Text><Text style={s.emotionCount}>{count}</Text></View>
            ))}
          </View>
        </>
      )}
    </>
  );
}

function TasksTab({ tasks, onAssign }: { tasks: any[]; onAssign: () => void }) {
  return (
    <>
      <SectionHeader label="Assigned Tasks" action={{ text: "Assign Task", onPress: onAssign }} />
      {tasks.length === 0 ? <EmptyState emoji="📋" title="No tasks assigned" subtitle="Tap 'Assign Task' to give this client a task" /> : (
        tasks.map((task) => (
          <View key={task.id} style={s.taskCard}>
            <View style={[s.taskDot, { backgroundColor: task.completedAt ? DS.colors.accent : DS.colors.border }]} />
            <View style={{ flex: 1 }}>
              <Text style={[s.taskTitle, task.completedAt && s.taskTitleDone]}>{task.title}</Text>
              {task.description && <Text style={s.taskDesc}>{task.description}</Text>}
              {task.dueDate && <Text style={s.taskDue}>Due: {new Date(task.dueDate).toLocaleDateString()}</Text>}
            </View>
            {task.completedAt && <Feather name="check-circle" size={18} color={DS.colors.accent} />}
          </View>
        ))
      )}
    </>
  );
}

function JournalTab({ entries, expandedId, onToggle }: { entries: any[]; expandedId: string | null; onToggle: (id: string) => void }) {
  const shared = entries.filter((e) => e.isShared);
  return (
    <>
      <SectionHeader label={`Shared Journal (${shared.length})`} />
      {shared.length === 0 ? <EmptyState emoji="📓" title="No shared entries" subtitle="Client hasn't shared any journal entries yet" /> : (
        shared.map((entry) => (
          <TouchableOpacity key={entry.id} style={s.journalCard} onPress={() => onToggle(entry.id)} activeOpacity={0.85}>
            <View style={s.journalHeader}>
              <Text style={s.journalDate}>{new Date(entry.createdAt).toLocaleDateString()}</Text>
              <Feather name={expandedId === entry.id ? "chevron-up" : "chevron-down"} size={16} color={DS.colors.muted} />
            </View>
            {entry.title && <Text style={s.journalTitle}>{entry.title}</Text>}
            <Text style={expandedId === entry.id ? s.journalBody : s.journalPreview} numberOfLines={expandedId === entry.id ? undefined : 2}>{entry.body ?? entry.content}</Text>
          </TouchableOpacity>
        ))
      )}
    </>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DS.colors.background },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: DS.spacing.lg, paddingVertical: DS.spacing.sm, borderBottomWidth: 1, borderColor: DS.colors.border, gap: DS.spacing.sm },
  backBtn: { padding: 4 },
  clientHeader: { flex: 1, flexDirection: "row", alignItems: "center" },
  clientName: { fontFamily: DS.fonts.semibold, fontSize: 16, color: DS.colors.dark },
  clientSub: { fontFamily: DS.fonts.regular, fontSize: 12, color: DS.colors.muted },
  aiBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: "#3DD68C22", borderWidth: 1, borderColor: "#3DD68C55" },
  aiBtnText: { fontFamily: DS.fonts.semibold, fontSize: 12, color: "#3DD68C" },
  aiPanel: { backgroundColor: "#0f1f0f", borderBottomWidth: 1, borderColor: "#3DD68C44", padding: DS.spacing.md },
  aiPanelHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: DS.spacing.xs },
  aiPanelTitle: { fontFamily: DS.fonts.semibold, fontSize: 13, color: "#3DD68C" },
  aiPanelText: { fontFamily: DS.fonts.regular, fontSize: 13, color: "#c0e8c0", lineHeight: 20 },
  tabBarScroll: { borderBottomWidth: 1, borderColor: DS.colors.border, maxHeight: 44 },
  tabBar: { paddingHorizontal: DS.spacing.md, gap: 0 },
  tabItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabItemActive: { borderBottomColor: DS.colors.dark },
  tabText: { fontFamily: DS.fonts.medium, fontSize: 13, color: DS.colors.muted },
  tabTextActive: { color: DS.colors.dark },
  scroll: { flex: 1 },
  content: { padding: DS.spacing.lg },
  statRow: { flexDirection: "row", backgroundColor: DS.colors.surface, borderRadius: DS.radius.md, borderWidth: 1, borderColor: DS.colors.border, marginBottom: DS.spacing.md },
  statBox: { flex: 1, alignItems: "center", paddingVertical: DS.spacing.md, gap: 4 },
  statVal: { fontFamily: DS.fonts.semibold, fontSize: 22, color: DS.colors.dark },
  statLbl: { fontFamily: DS.fonts.regular, fontSize: 11, color: DS.colors.muted, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: DS.colors.border, marginVertical: DS.spacing.sm },
  emotionsRow: { flexDirection: "row", flexWrap: "wrap", gap: DS.spacing.xs },
  emotionChip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: DS.radius.full, borderWidth: 1, borderColor: DS.colors.border, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: DS.colors.surface },
  emotionText: { fontFamily: DS.fonts.medium, fontSize: 12, color: DS.colors.dark },
  emotionCount: { fontFamily: DS.fonts.regular, fontSize: 11, color: DS.colors.muted },
  taskCard: { flexDirection: "row", alignItems: "flex-start", gap: DS.spacing.sm, backgroundColor: DS.colors.background, borderRadius: DS.radius.md, borderWidth: 1, borderColor: DS.colors.border, padding: DS.spacing.md, marginBottom: DS.spacing.xs },
  taskDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  taskTitle: { fontFamily: DS.fonts.medium, fontSize: 14, color: DS.colors.dark, marginBottom: 2 },
  taskTitleDone: { textDecorationLine: "line-through", color: DS.colors.muted },
  taskDesc: { fontFamily: DS.fonts.regular, fontSize: 12, color: DS.colors.muted, lineHeight: 17 },
  taskDue: { fontFamily: DS.fonts.regular, fontSize: 11, color: DS.colors.info, marginTop: 4 },
  journalCard: { backgroundColor: DS.colors.background, borderRadius: DS.radius.md, borderWidth: 1, borderColor: DS.colors.border, padding: DS.spacing.md, marginBottom: DS.spacing.xs },
  journalHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: DS.spacing.xs },
  journalDate: { fontFamily: DS.fonts.medium, fontSize: 12, color: DS.colors.muted },
  journalTitle: { fontFamily: DS.fonts.semibold, fontSize: 14, color: DS.colors.dark, marginBottom: 4 },
  journalBody: { fontFamily: DS.fonts.regular, fontSize: 14, color: DS.colors.dark, lineHeight: 20 },
  journalPreview: { fontFamily: DS.fonts.regular, fontSize: 13, color: DS.colors.muted, lineHeight: 18 },
  templateRow: { flexDirection: "row", gap: 8, marginBottom: DS.spacing.md },
  templateChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: DS.radius.full, borderWidth: 1, borderColor: DS.colors.border, backgroundColor: DS.colors.surface },
  templateChipActive: { backgroundColor: DS.colors.dark, borderColor: DS.colors.dark },
  templateChipText: { fontFamily: DS.fonts.medium, fontSize: 12, color: DS.colors.muted },
  templateChipTextActive: { color: DS.colors.white },
  fieldLabel: { fontFamily: DS.fonts.semibold, fontSize: 11, color: DS.colors.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, marginTop: DS.spacing.sm },
  notesInput: { borderWidth: 1, borderColor: DS.colors.border, borderRadius: DS.radius.md, padding: DS.spacing.md, fontFamily: DS.fonts.regular, fontSize: 14, color: DS.colors.dark, backgroundColor: DS.colors.background },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: DS.spacing.xs, backgroundColor: DS.colors.dark, borderRadius: DS.radius.md, paddingVertical: 12, paddingHorizontal: DS.spacing.lg },
  saveBtnText: { fontFamily: DS.fonts.medium, fontSize: 14, color: DS.colors.white },
  cancelBtn: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: DS.radius.md, paddingVertical: 12, borderWidth: 1, borderColor: DS.colors.border },
  noteCard: { backgroundColor: DS.colors.background, borderRadius: DS.radius.md, borderWidth: 1, borderColor: DS.colors.border, marginBottom: DS.spacing.xs, overflow: "hidden" },
  noteCardHeader: { flexDirection: "row", alignItems: "center", padding: DS.spacing.md },
  noteCardTitle: { fontFamily: DS.fonts.medium, fontSize: 14, color: DS.colors.dark },
  noteCardMeta: { fontFamily: DS.fonts.regular, fontSize: 11, color: DS.colors.muted, marginTop: 2 },
  goalForm: { backgroundColor: DS.colors.surface, borderRadius: DS.radius.md, borderWidth: 1, borderColor: DS.colors.border, padding: DS.spacing.md, marginBottom: DS.spacing.md },
  goalCard: { backgroundColor: DS.colors.background, borderRadius: DS.radius.md, borderWidth: 1, borderColor: DS.colors.border, padding: DS.spacing.md, marginBottom: DS.spacing.xs },
  goalTitle: { fontFamily: DS.fonts.semibold, fontSize: 14, color: DS.colors.dark },
  goalDesc: { fontFamily: DS.fonts.regular, fontSize: 13, color: DS.colors.muted, marginTop: 3, lineHeight: 18 },
  goalMeta: { fontFamily: DS.fonts.regular, fontSize: 11, color: DS.colors.muted, marginTop: 4 },
  goalActionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: DS.radius.full, borderWidth: 1, borderColor: DS.colors.border, backgroundColor: DS.colors.surface },
  goalActionText: { fontFamily: DS.fonts.medium, fontSize: 12, color: DS.colors.muted },
  modal: { flex: 1, backgroundColor: DS.colors.background },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: DS.spacing.lg, borderBottomWidth: 1, borderColor: DS.colors.border },
  modalTitle: { fontFamily: DS.fonts.semibold, fontSize: 20, color: DS.colors.dark },
  modalSub: { fontFamily: DS.fonts.regular, fontSize: 13, color: DS.colors.muted, paddingHorizontal: DS.spacing.lg, paddingTop: DS.spacing.sm },
  presetCard: { flexDirection: "row", alignItems: "center", gap: DS.spacing.md, backgroundColor: DS.colors.background, borderRadius: DS.radius.md, borderWidth: 1, borderColor: DS.colors.border, padding: DS.spacing.md, marginBottom: DS.spacing.xs },
  presetTitle: { fontFamily: DS.fonts.medium, fontSize: 14, color: DS.colors.dark, marginBottom: 2 },
  presetDesc: { fontFamily: DS.fonts.regular, fontSize: 12, color: DS.colors.muted, lineHeight: 17 },
});
