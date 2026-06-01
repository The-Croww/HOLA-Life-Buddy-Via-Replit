import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Send,
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  BookOpen,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAuth } from "../App";

type MoodEntry = { id: string; moodScore: number; emotions: string[]; note: string | null; createdAt: string };
type Task = { id: string; title: string; description: string; dueDate: string | null; completedAt: string | null; createdAt: string };
type JournalEntry = { id: string; title: string; body: string; moodTag: string | null; isShared: boolean; createdAt: string };
type Goal = { id: string; title: string; description: string; targetDate: string | null; status: "active" | "achieved" | "paused"; createdAt: string; achievedAt: string | null };
type SessionNote = { id: string; template: "soap" | "progress" | "free"; title: string; content: Record<string, string>; createdAt: string };

const MOOD_EMOJIS: Record<string, string> = { happy: "😊", calm: "😌", anxious: "😰", sad: "😢", angry: "😤", grateful: "🙏", tired: "😴", excited: "🤩" };

const TASK_PRESETS = [
  { label: "Breathing exercise", desc: "Practice 4-7-8 breathing for 5 minutes" },
  { label: "Journal prompt", desc: "Write about one thing you're grateful for today" },
  { label: "Meditation", desc: "Try a 10-minute guided mindfulness session" },
  { label: "CBT worksheet", desc: "Complete the thought record worksheet" },
  { label: "Physical activity", desc: "Take a 20-minute walk outside" },
  { label: "Custom", desc: "" },
];

const SOAP_FIELDS = [
  { key: "subjective", label: "Subjective", placeholder: "What the client reported…" },
  { key: "objective", label: "Objective", placeholder: "Observable data, mood scores, behaviours…" },
  { key: "assessment", label: "Assessment", placeholder: "Clinical impressions and diagnosis…" },
  { key: "plan", label: "Plan", placeholder: "Next steps, homework, referrals…" },
];
const PROGRESS_FIELDS = [
  { key: "goals", label: "Session goals", placeholder: "Goals set for this session…" },
  { key: "covered", label: "What was covered", placeholder: "Topics and techniques discussed…" },
  { key: "homework", label: "Homework assigned", placeholder: "Tasks given to the client…" },
  { key: "next", label: "Next session focus", placeholder: "Areas to address next time…" },
];

function fmtDay(iso: string) { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
function fmtFull(iso: string) { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
const Divider = () => <div style={{ height: 1, background: "var(--border)", margin: "20px 0" }} />;
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: 12 }}>{children}</div>
);

const fieldStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", background: "var(--bg2)", color: "var(--fg)", boxSizing: "border-box" as const };

export function ClientProfile({ clientId, clientName, onBack }: { clientId: string; clientName: string; onBack: () => void }) {
  const { user } = useAuth();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [customTitle, setCustomTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [taskSuccess, setTaskSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "journal" | "notes" | "goals">("overview");

  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [savedNotes, setSavedNotes] = useState<SessionNote[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loadingMood, setLoadingMood] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingJournal, setLoadingJournal] = useState(true);
  const [expandedJournal, setExpandedJournal] = useState<string | null>(null);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  // AI Summary
  const [aiSummary, setAiSummary] = useState<{ summary: string; generatedAt: string; fromCache: boolean } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Notes editor
  const [noteTemplate, setNoteTemplate] = useState<"soap" | "progress" | "free">("soap");
  const [noteContent, setNoteContent] = useState<Record<string, string>>({});
  const [noteTitle, setNoteTitle] = useState("Session note");
  const [savingNote, setSavingNote] = useState(false);

  // Goals
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: "", description: "", targetDate: "" });
  const [savingGoal, setSavingGoal] = useState(false);
  const [celebratingGoal, setCelebratingGoal] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.token) return;
    const h = { Authorization: `Bearer ${user.token}` };

    fetch(`/api/v1/psychologist/clients/${clientId}/mood`, { headers: h })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setMoodEntries(d.entries ?? []))
      .finally(() => setLoadingMood(false));

    fetch(`/api/v1/psychologist/clients/${clientId}/tasks`, { headers: h })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setTasks(d.tasks ?? []))
      .finally(() => setLoadingTasks(false));

    fetch(`/api/v1/psychologist/clients/${clientId}/journal`, { headers: h })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setJournalEntries(d.entries ?? []))
      .finally(() => setLoadingJournal(false));

    fetch(`/api/v1/psychologist/clients/${clientId}/notes`, { headers: h })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setSavedNotes(d.notes ?? []));

    fetch(`/api/v1/psychologist/clients/${clientId}/goals`, { headers: h })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setGoals(d.goals ?? []));
  }, [clientId, user?.token]);

  const chartData = moodEntries.slice(0, 14).reverse().map((e) => ({ day: fmtDay(e.createdAt), score: e.moodScore }));
  const avgMood = moodEntries.length ? (moodEntries.slice(0, 7).reduce((s, e) => s + e.moodScore, 0) / Math.min(moodEntries.length, 7)).toFixed(1) : "—";
  const emotionCounts = new Map<string, number>();
  moodEntries.slice(0, 10).forEach((e) => e.emotions.forEach((em) => emotionCounts.set(em, (emotionCounts.get(em) ?? 0) + 1)));
  const topEmotions = Array.from(emotionCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([e]) => e);

  const handleAssignTask = async () => {
    if (!user?.token) return;
    const preset = TASK_PRESETS[selectedPreset];
    const title = selectedPreset === 5 ? customTitle.trim() : preset.label;
    const description = selectedPreset === 5 ? taskDesc.trim() : preset.desc;
    if (!title) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/psychologist/clients/${clientId}/tasks`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, dueDate: taskDue || null }),
      });
      if (res.ok) {
        const newTask = await res.json();
        setTasks((prev) => [newTask, ...prev]);
        setTaskSuccess(true);
        setTimeout(() => { setShowTaskModal(false); setTaskSuccess(false); setTaskDesc(""); setTaskDue(""); setCustomTitle(""); }, 1200);
      }
    } finally { setSubmitting(false); }
  };

  const handleAISummary = async () => {
    if (!user?.token) return;
    setAiLoading(true);
    setShowAiPanel(true);
    try {
      const res = await fetch(`/api/v1/psychologist/clients/${clientId}/ai-summary`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) setAiSummary(await res.json());
    } finally { setAiLoading(false); }
  };

  const handleSaveNote = async () => {
    if (!user?.token) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/v1/psychologist/clients/${clientId}/notes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ template: noteTemplate, title: noteTitle, content: noteContent }),
      });
      if (res.ok) {
        const note = await res.json();
        setSavedNotes((prev) => [note, ...prev]);
        setNoteContent({});
        setNoteTitle("Session note");
      }
    } finally { setSavingNote(false); }
  };

  const handleCreateGoal = async () => {
    if (!user?.token || !goalForm.title) return;
    setSavingGoal(true);
    try {
      const res = await fetch(`/api/v1/psychologist/clients/${clientId}/goals`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ title: goalForm.title, description: goalForm.description, targetDate: goalForm.targetDate || null }),
      });
      if (res.ok) {
        const goal = await res.json();
        setGoals((prev) => [goal, ...prev]);
        setGoalForm({ title: "", description: "", targetDate: "" });
        setShowGoalForm(false);
      }
    } finally { setSavingGoal(false); }
  };

  const handleGoalStatus = async (goalId: string, status: Goal["status"]) => {
    if (!user?.token) return;
    if (status === "achieved") setCelebratingGoal(goalId);
    const res = await fetch(`/api/v1/psychologist/clients/${clientId}/goals/${goalId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${user.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setGoals((prev) => prev.map((g) => g.id === goalId ? updated : g));
      if (status === "achieved") setTimeout(() => setCelebratingGoal(null), 2500);
    }
  };

  const noteFields = noteTemplate === "soap" ? SOAP_FIELDS : noteTemplate === "progress" ? PROGRESS_FIELDS : [];

  return (
    <div style={{ padding: 32, maxWidth: 1000 }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--muted)", marginBottom: 20, fontFamily: "Inter, sans-serif" }}>
        <ArrowLeft size={16} /> Back to clients
      </button>

      {/* Client header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#0a0a0a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 600 }}>
            {clientName.charAt(0)}
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)" }}>{clientName}</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>Linked client · {moodEntries.length} mood entries</div>
          </div>
          <button
            onClick={handleAISummary}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 8, background: aiSummary ? "#3dd68c22" : "var(--bg2)", color: aiSummary ? "#3dd68c" : "var(--muted)", border: `1px solid ${aiSummary ? "#3dd68c55" : "var(--border)"}`, cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "Inter, sans-serif" }}
          >
            <Sparkles size={14} /> AI Summary
          </button>
        </div>
        <button
          onClick={() => { setShowTaskModal(true); setTaskSuccess(false); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 8, background: "#0a0a0a", color: "#fff", border: "none", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }}
        >
          <Plus size={15} /> Assign task
        </button>
      </div>

      {/* AI Summary panel */}
      {showAiPanel && (
        <div style={{ marginTop: 16, background: "var(--bg2)", border: "1px solid #3dd68c44", borderRadius: 12, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={15} color="#3dd68c" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#3dd68c" }}>AI Clinical Summary</span>
              {aiSummary?.fromCache && <span style={{ fontSize: 11, color: "var(--muted)", background: "var(--bg)", padding: "2px 7px", borderRadius: 999, border: "1px solid var(--border)" }}>cached</span>}
            </div>
            <button onClick={() => setShowAiPanel(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={15} /></button>
          </div>
          {aiLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--muted)", fontSize: 13 }}>
              <div style={{ width: 14, height: 14, border: "2px solid #3dd68c", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              Analyzing {clientName}'s data…
            </div>
          ) : aiSummary ? (
            <>
              <p style={{ fontSize: 14, color: "var(--fg)", lineHeight: 1.7, margin: 0 }}>{aiSummary.summary}</p>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>Generated {new Date(aiSummary.generatedAt).toLocaleString()} · <span style={{ background: "var(--bg)", padding: "1px 6px", borderRadius: 4, border: "1px solid var(--border)" }}>Generated by AI</span></div>
            </>
          ) : null}
        </div>
      )}

      <Divider />

      {/* Stats row */}
      <SectionLabel>At a glance</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 0 }}>
        {[
          { label: "Avg mood (7d)", value: avgMood, emoji: "📊" },
          { label: "Total entries", value: moodEntries.length, emoji: "📝" },
          { label: "Tasks assigned", value: tasks.length, emoji: "✅" },
          { label: "Active goals", value: goals.filter((g) => g.status === "active").length, emoji: "🎯" },
        ].map((stat) => (
          <div key={stat.label} style={{ background: "var(--bg2)", borderRadius: 10, padding: 14, textAlign: "center", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{stat.emoji}</div>
            <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 4, color: "var(--fg)" }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <Divider />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "var(--bg2)", padding: 4, borderRadius: 10, width: "fit-content", border: "1px solid var(--border)" }}>
        {(["overview", "tasks", "journal", "notes", "goals"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{ padding: "8px 14px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "Inter, sans-serif", background: activeTab === t ? "#0a0a0a" : "transparent", color: activeTab === t ? "#fff" : "var(--muted)" }}
          >
            {t === "journal" ? (
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <BookOpen size={12} /> Journal
                {journalEntries.length > 0 && <span style={{ background: "#3dd68c", color: "#000", borderRadius: 99, padding: "0 6px", fontSize: 10, fontWeight: 600 }}>{journalEntries.length}</span>}
              </span>
            ) : t === "goals" ? (
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Target size={12} /> Goals</span>
            ) : (
              t.charAt(0).toUpperCase() + t.slice(1)
            )}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW TAB ─── */}
      {activeTab === "overview" && (
        <>
          <SectionLabel>Mood trend</SectionLabel>
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 4 }}>14-day mood trend</div>
            <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />
            {loadingMood ? (
              <div style={{ textAlign: "center", color: "var(--muted)", padding: 20 }}>Loading…</div>
            ) : chartData.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--muted)", padding: 20 }}>No mood data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                  <YAxis domain={[1, 10]} tick={{ fontSize: 11, fill: "var(--muted)" }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 13, background: "#fff" }} />
                  <Line type="monotone" dataKey="score" stroke="#3dd68c" strokeWidth={2} dot={{ r: 3, fill: "#3dd68c" }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          {topEmotions.length > 0 && (
            <>
              <SectionLabel>Recent emotions</SectionLabel>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
                <div style={{ height: 1, background: "var(--border)", marginBottom: 16 }} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {topEmotions.map((e) => (
                    <span key={e} style={{ padding: "5px 12px", borderRadius: 999, background: "var(--bg2)", fontSize: 13, color: "var(--muted)", border: "1px solid var(--border)" }}>{e}</span>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ─── TASKS TAB ─── */}
      {activeTab === "tasks" && (
        <>
          <SectionLabel>Assigned tasks ({tasks.length})</SectionLabel>
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
            <div style={{ height: 1, background: "var(--border)", marginBottom: 16 }} />
            {loadingTasks ? <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</div>
              : tasks.length === 0 ? <div style={{ color: "var(--muted)", fontSize: 13 }}>No tasks assigned yet.</div>
              : tasks.map((task, i) => (
                <div key={task.id}>
                  <div style={{ padding: "14px 0", display: "flex", gap: 12, alignItems: "flex-start" }}>
                    {task.completedAt ? <CheckCircle2 size={18} color="var(--calm)" style={{ flexShrink: 0, marginTop: 1 }} /> : <Clock size={18} color="var(--muted)" style={{ flexShrink: 0, marginTop: 1 }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 14, textDecoration: task.completedAt ? "line-through" : "none", color: task.completedAt ? "var(--muted)" : "var(--fg)" }}>{task.title}</div>
                      {task.description && <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{task.description}</div>}
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{task.completedAt ? `✓ Completed ${fmtDay(task.completedAt)}` : task.dueDate ? `Due ${fmtDay(task.dueDate)}` : `Assigned ${fmtDay(task.createdAt)}`}</div>
                    </div>
                  </div>
                  {i < tasks.length - 1 && <div style={{ height: 1, background: "var(--border)" }} />}
                </div>
              ))
            }
          </div>
        </>
      )}

      {/* ─── JOURNAL TAB ─── */}
      {activeTab === "journal" && (
        <>
          <SectionLabel>Shared journal entries ({journalEntries.length})</SectionLabel>
          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 12, color: "var(--muted)", padding: "8px 12px", background: "var(--bg2)", borderRadius: 8, marginBottom: 0 }}>
              Only entries the client has chosen to share with you are shown here.
            </div>
            <div style={{ height: 1, background: "var(--border)", margin: "16px 0" }} />
            {loadingJournal ? <div style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</div>
              : journalEntries.length === 0 ? (
                <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 32 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📓</div>
                  <div style={{ fontWeight: 500, marginBottom: 4, color: "var(--fg)" }}>No shared entries yet</div>
                  <div style={{ fontSize: 12 }}>Entries marked "Share with my psychologist" will appear here.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {journalEntries.map((entry, i) => (
                    <div key={entry.id}>
                      <button
                        onClick={() => setExpandedJournal(expandedJournal === entry.id ? null : entry.id)}
                        style={{ width: "100%", padding: "14px 0", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "Inter, sans-serif" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                          {entry.moodTag && MOOD_EMOJIS[entry.moodTag] && <span style={{ fontSize: 18, flexShrink: 0 }}>{MOOD_EMOJIS[entry.moodTag]}</span>}
                          <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                            <div style={{ fontWeight: 500, fontSize: 14, color: "var(--fg)", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.title}</div>
                            <div style={{ fontSize: 11, color: "var(--muted)" }}>{fmtDay(entry.createdAt)}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 12 }}>{expandedJournal === entry.id ? "▲" : "▼"}</span>
                      </button>
                      {expandedJournal === entry.id && (
                        <div style={{ padding: "8px 0 14px", fontSize: 14, color: "var(--fg)", lineHeight: 1.7, borderTop: "1px dashed var(--border)" }}>{entry.body}</div>
                      )}
                      {i < journalEntries.length - 1 && <div style={{ height: 1, background: "var(--border)" }} />}
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </>
      )}

      {/* ─── NOTES TAB ─── */}
      {activeTab === "notes" && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <SectionLabel>Session notes</SectionLabel>
            <div style={{ display: "flex", gap: 6 }}>
              {(["soap", "progress", "free"] as const).map((t) => (
                <button key={t} onClick={() => { setNoteTemplate(t); setNoteContent({}); }} style={{ padding: "5px 11px", borderRadius: 6, border: "1px solid var(--border)", background: noteTemplate === t ? "#0a0a0a" : "var(--bg2)", color: noteTemplate === t ? "#fff" : "var(--muted)", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                  {t === "soap" ? "SOAP" : t === "progress" ? "Progress" : "Free text"}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>Private notes — not visible to the client.</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Note title</div>
              <input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} style={fieldStyle} placeholder="e.g. Session 4 — Oct 12" />
            </div>

            {noteTemplate === "free" ? (
              <textarea
                value={noteContent.body ?? ""}
                onChange={(e) => setNoteContent({ body: e.target.value })}
                placeholder="Write session notes here…"
                style={{ ...fieldStyle, minHeight: 200, resize: "vertical" }}
              />
            ) : (
              noteFields.map((f) => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{f.label}</div>
                  <textarea
                    value={noteContent[f.key] ?? ""}
                    onChange={(e) => setNoteContent((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{ ...fieldStyle, minHeight: 80, resize: "vertical" }}
                  />
                </div>
              ))
            )}

            <button
              onClick={handleSaveNote}
              disabled={savingNote}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 8, background: "#0a0a0a", color: "#fff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "Inter, sans-serif", opacity: savingNote ? 0.7 : 1, marginTop: 4 }}
            >
              <FileText size={14} /> {savingNote ? "Saving…" : "Save note"}
            </button>
          </div>

          {/* Past notes */}
          {savedNotes.length > 0 && (
            <>
              <SectionLabel>Past notes ({savedNotes.length})</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {savedNotes.map((note) => (
                  <div key={note.id} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                    <button
                      onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
                      style={{ width: "100%", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "Inter, sans-serif" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <FileText size={14} color="var(--muted)" />
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg)" }}>{note.title}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{note.template.toUpperCase()} · {fmtFull(note.createdAt)}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{expandedNote === note.id ? "▲" : "▼"}</span>
                    </button>
                    {expandedNote === note.id && (
                      <div style={{ padding: "0 16px 16px", borderTop: "1px solid var(--border)" }}>
                        {Object.entries(note.content).map(([key, val]) => (
                          <div key={key} style={{ marginTop: 12 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{key}</div>
                            <div style={{ fontSize: 13, color: "var(--fg)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{val}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ─── GOALS TAB ─── */}
      {activeTab === "goals" && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <SectionLabel>Treatment goals</SectionLabel>
            <button onClick={() => setShowGoalForm(!showGoalForm)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 8, background: "#0a0a0a", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "Inter, sans-serif" }}>
              <Plus size={13} /> Add goal
            </button>
          </div>

          {showGoalForm && (
            <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 14 }}>New treatment goal</div>
              {[
                { label: "Goal title", node: <input value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} placeholder="e.g. Reduce anxiety in social situations" style={fieldStyle} /> },
                { label: "Description (optional)", node: <textarea value={goalForm.description} onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })} placeholder="Describe the goal and how progress will be measured…" style={{ ...fieldStyle, minHeight: 70, resize: "vertical" as const }} /> },
                { label: "Target date (optional)", node: <input type="date" value={goalForm.targetDate} onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })} style={fieldStyle} /> },
              ].map(({ label, node }) => (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{label}</div>
                  {node}
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button onClick={() => setShowGoalForm(false)} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "1px solid var(--border)", background: "none", color: "var(--muted)", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Cancel</button>
                <button onClick={handleCreateGoal} disabled={savingGoal || !goalForm.title} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", background: "#0a0a0a", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif", opacity: savingGoal || !goalForm.title ? 0.6 : 1 }}>
                  {savingGoal ? "Saving…" : "Create goal"}
                </button>
              </div>
            </div>
          )}

          {goals.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🎯</div>
              <div style={{ fontWeight: 600, color: "var(--fg)", marginBottom: 4 }}>No goals set yet</div>
              <div style={{ fontSize: 13 }}>Add treatment goals to track this client's therapeutic progress.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {goals.map((goal) => {
                const isCelebrating = celebratingGoal === goal.id;
                return (
                  <div key={goal.id} style={{ background: isCelebrating ? "#3dd68c11" : "var(--bg)", border: `1px solid ${isCelebrating ? "#3dd68c" : goal.status === "achieved" ? "#3dd68c44" : "var(--border)"}`, borderRadius: 12, padding: 16, transition: "all 0.4s ease" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          {isCelebrating ? <span style={{ fontSize: 18 }}>🎉</span> : goal.status === "achieved" ? <CheckCircle2 size={16} color="#3dd68c" /> : goal.status === "paused" ? <Clock size={16} color="var(--muted)" /> : <Target size={16} color="#6366f1" />}
                          <span style={{ fontSize: 14, fontWeight: 600, color: goal.status === "achieved" ? "var(--muted)" : "var(--fg)", textDecoration: goal.status === "achieved" ? "line-through" : "none" }}>{goal.title}</span>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, fontWeight: 600, background: goal.status === "achieved" ? "#3dd68c22" : goal.status === "paused" ? "var(--bg2)" : "#6366f122", color: goal.status === "achieved" ? "#3dd68c" : goal.status === "paused" ? "var(--muted)" : "#6366f1" }}>
                            {goal.status}
                          </span>
                        </div>
                        {goal.description && <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginLeft: 24 }}>{goal.description}</div>}
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6, marginLeft: 24 }}>
                          Added {fmtDay(goal.createdAt)}{goal.targetDate ? ` · Target: ${fmtDay(goal.targetDate)}` : ""}{goal.achievedAt ? ` · Achieved ${fmtDay(goal.achievedAt)} 🎉` : ""}
                        </div>
                      </div>
                      {goal.status !== "achieved" && (
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          {goal.status === "active" && (
                            <button onClick={() => handleGoalStatus(goal.id, "paused")} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Pause</button>
                          )}
                          {goal.status === "paused" && (
                            <button onClick={() => handleGoalStatus(goal.id, "active")} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid var(--border)", background: "none", color: "var(--muted)", fontSize: 12, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Resume</button>
                          )}
                          <button onClick={() => handleGoalStatus(goal.id, "achieved")} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #3dd68c", background: "#3dd68c22", color: "#3dd68c", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>✓ Achieved</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── TASK MODAL ─── */}
      {showTaskModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 460, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            {taskSuccess ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <div style={{ fontWeight: 600, fontSize: 16, color: "#0a0a0a" }}>Task assigned!</div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#0a0a0a" }}>Assign task to {clientName}</div>
                  <button onClick={() => setShowTaskModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888" }}><X size={18} /></button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {TASK_PRESETS.map((p, i) => (
                    <button key={i} onClick={() => setSelectedPreset(i)} style={{ padding: "10px 14px", borderRadius: 9, border: `1.5px solid ${selectedPreset === i ? "#0a0a0a" : "#e0e0e0"}`, background: selectedPreset === i ? "#f8f8f8" : "#fff", cursor: "pointer", textAlign: "left", fontFamily: "Inter, sans-serif", transition: "all 0.1s" }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#0a0a0a" }}>{p.label}</div>
                      {p.desc && <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{p.desc}</div>}
                    </button>
                  ))}
                </div>
                <div style={{ height: 1, background: "#e0e0e0", margin: "16px 0" }} />
                {selectedPreset === 5 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Task title</div>
                    <input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="e.g. Call a supportive friend" style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", background: "#fff", color: "#0a0a0a", boxSizing: "border-box" }} />
                  </div>
                )}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Instructions for client</div>
                  <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder="Add any specific guidance…" style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 13, fontFamily: "Inter, sans-serif", minHeight: 80, outline: "none", resize: "vertical", background: "#fff", color: "#0a0a0a", boxSizing: "border-box" }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Due date (optional)</div>
                  <input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 13, fontFamily: "Inter, sans-serif", outline: "none", background: "#fff", color: "#0a0a0a", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setShowTaskModal(false)} style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #e0e0e0", background: "#fff", cursor: "pointer", fontSize: 14, fontFamily: "Inter, sans-serif", color: "#0a0a0a", fontWeight: 500 }}>Cancel</button>
                  <button onClick={handleAssignTask} disabled={submitting} style={{ flex: 1, padding: 12, borderRadius: 8, background: "#0a0a0a", color: "#fff", border: "none", cursor: submitting ? "wait" : "pointer", fontSize: 14, fontWeight: 600, fontFamily: "Inter, sans-serif", opacity: submitting ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Send size={13} /> {submitting ? "Sending…" : "Assign task"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
