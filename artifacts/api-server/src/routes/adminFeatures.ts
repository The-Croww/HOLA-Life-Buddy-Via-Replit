import { Router, type Response } from "express";
import { authMiddleware, type AuthRequest } from "../middleware/auth";
import {
  dbGetUser,
  dbGetMoodEntries,
  dbGetAllTasks,
  dbGetUserTasks,
  dbGetJournalEntries,
  dbIsClientOfPsychologist,
  dbGetNotes,
  dbAddNote,
  dbGetGoals,
  dbAddGoal,
  dbUpdateGoal,
  dbGetAppointmentsByPsychologist,
  dbCreateAppointment,
  dbGetAppointmentsByClient,
  dbGetAISummaryCache,
  dbSetAISummaryCache,
  dbGetClientsByPsychologist,
  type SessionNote,
  type Goal,
  type Appointment,
} from "../lib/db";

const router = Router();

function psychOnly(req: AuthRequest, res: Response, next: () => void): void {
  if (req.userRole !== "psychologist" && req.userRole !== "admin") {
    res.status(403).json({ error: "Psychologist access required" });
    return;
  }
  next();
}

// ───────────────────────────────────────────────────────────────
// AI SUMMARY  POST /v1/psychologist/clients/:id/ai-summary
// ───────────────────────────────────────────────────────────────
router.post(
  "/v1/psychologist/clients/:id/ai-summary",
  authMiddleware,
  psychOnly as any,
  async (req: AuthRequest, res: Response) => {
    const psychId = req.userId!;
    const clientId = req.params.id as string;

    if (!dbIsClientOfPsychologist(psychId, clientId)) {
      res.status(403).json({ error: "Not your client" });
      return;
    }

    // 24-hour cache
    const cached = dbGetAISummaryCache(clientId);
    if (cached) {
      const ageMs = Date.now() - new Date(cached.generatedAt).getTime();
      if (ageMs < 24 * 60 * 60 * 1000) {
        res.json({ summary: cached.summary, generatedAt: cached.generatedAt, fromCache: true });
        return;
      }
    }

    const client = dbGetUser(clientId);
    if (!client) { res.status(404).json({ error: "Client not found" }); return; }

    const moodEntries = dbGetMoodEntries(clientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 14);

    const allTasks = dbGetUserTasks(clientId);
    const completedTasks = allTasks.filter((t) => t.completedAt);
    const avgMood = moodEntries.length
      ? (moodEntries.reduce((s, e) => s + e.moodScore, 0) / moodEntries.length).toFixed(1)
      : "N/A";

    const emotionCounts = new Map<string, number>();
    moodEntries.forEach((e) => e.emotions.forEach((em) => emotionCounts.set(em, (emotionCounts.get(em) ?? 0) + 1)));
    const topEmotions = Array.from(emotionCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([e]) => e);

    const GROQ_KEY = process.env.GROQ_API_KEY;
    let summary = "";

    if (GROQ_KEY) {
      try {
        const prompt = `You are a clinical assistant. Generate a brief 3-4 sentence clinical summary for a therapy client based on their recent data.

Client: ${client.name}
14-day average mood: ${avgMood}/10
Top emotions reported: ${topEmotions.join(", ") || "none"}
Mood entries this period: ${moodEntries.length}
Tasks assigned: ${allTasks.length}, completed: ${completedTasks.length}
Recent mood scores (newest first): ${moodEntries.slice(0, 7).map((e) => e.moodScore).join(", ")}

Write a clinical summary covering: mood pattern, emotional themes, engagement level, and 1-2 suggested focus areas. Be concise, empathetic, and professional. Do not use the client's name in the summary.`;

        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama3-8b-8192",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 300,
          }),
        });
        if (groqRes.ok) {
          const data = await groqRes.json() as any;
          summary = data.choices?.[0]?.message?.content?.trim() ?? "";
        }
      } catch (_) {}
    }

    if (!summary) {
      const trend = moodEntries.length >= 3
        ? moodEntries[0].moodScore > moodEntries[moodEntries.length - 1].moodScore ? "upward" : "downward"
        : "stable";
      summary = `${client.name}'s mood data over the past 14 days shows an average score of ${avgMood}/10 with a ${trend} trend. ` +
        `Primary emotional themes include ${topEmotions.slice(0, 3).join(", ") || "varied emotions"}, suggesting ${Number(avgMood) < 5 ? "areas of significant distress warranting closer attention" : "moderate emotional regulation"}. ` +
        `Task engagement is ${completedTasks.length > 0 ? "present, with some completed assignments" : "limited — consider reviewing barriers to homework completion"}. ` +
        `Recommended focus areas: ${Number(avgMood) < 5 ? "mood stabilization and coping strategies" : "maintaining progress and building resilience"}.`;
    }

    const entry = { summary, generatedAt: new Date().toISOString() };
    dbSetAISummaryCache(clientId, entry);
    res.json({ ...entry, fromCache: false });
  }
);

// ───────────────────────────────────────────────────────────────
// NOTES  GET/POST /v1/psychologist/clients/:id/notes
// ───────────────────────────────────────────────────────────────
router.get(
  "/v1/psychologist/clients/:id/notes",
  authMiddleware,
  psychOnly as any,
  (req: AuthRequest, res: Response) => {
    const psychId = req.userId!;
    const clientId = req.params.id as string;
    if (!dbIsClientOfPsychologist(psychId, clientId)) { res.status(403).json({ error: "Not your client" }); return; }
    const notes = dbGetNotes(clientId, psychId);
    res.json({ notes });
  }
);

router.post(
  "/v1/psychologist/clients/:id/notes",
  authMiddleware,
  psychOnly as any,
  (req: AuthRequest, res: Response) => {
    const psychId = req.userId!;
    const clientId = req.params.id as string;
    if (!dbIsClientOfPsychologist(psychId, clientId)) { res.status(403).json({ error: "Not your client" }); return; }

    const { template = "free", title = "Session note", content = {} } = req.body;
    const note: SessionNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      clientId,
      psychologistId: psychId,
      template,
      title,
      content,
      createdAt: new Date().toISOString(),
    };

    dbAddNote(note);
    res.status(201).json(note);
  }
);

// ───────────────────────────────────────────────────────────────
// GOALS  GET/POST/PATCH /v1/psychologist/clients/:id/goals
// ───────────────────────────────────────────────────────────────
router.get(
  "/v1/psychologist/clients/:id/goals",
  authMiddleware,
  (req: AuthRequest, res: Response) => {
    const clientId = req.params.id as string;
    const userId = req.userId!;
    const role = req.userRole;

    if (role !== "psychologist" && role !== "admin" && userId !== clientId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const goals = dbGetGoals(clientId);
    res.json({ goals });
  }
);

router.post(
  "/v1/psychologist/clients/:id/goals",
  authMiddleware,
  psychOnly as any,
  (req: AuthRequest, res: Response) => {
    const psychId = req.userId!;
    const clientId = req.params.id as string;
    if (!dbIsClientOfPsychologist(psychId, clientId)) { res.status(403).json({ error: "Not your client" }); return; }

    const { title, description = "", targetDate = null } = req.body;
    if (!title) { res.status(400).json({ error: "title is required" }); return; }

    const goal: Goal = {
      id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      clientId,
      psychologistId: psychId,
      title,
      description,
      targetDate,
      status: "active",
      createdAt: new Date().toISOString(),
      achievedAt: null,
    };

    dbAddGoal(goal);
    res.status(201).json(goal);
  }
);

router.patch(
  "/v1/psychologist/clients/:id/goals/:goalId",
  authMiddleware,
  psychOnly as any,
  (req: AuthRequest, res: Response) => {
    const psychId = req.userId!;
    const clientId = req.params.id as string;
    const goalId = req.params.goalId as string;
    if (!dbIsClientOfPsychologist(psychId, clientId)) { res.status(403).json({ error: "Not your client" }); return; }

    const { status, title, description, targetDate } = req.body;
    const updates: Partial<Goal> = {};
    if (status) {
      updates.status = status;
      if (status === "achieved") updates.achievedAt = new Date().toISOString();
    }
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (targetDate !== undefined) updates.targetDate = targetDate;

    const updated = dbUpdateGoal(goalId, updates);
    if (!updated) { res.status(404).json({ error: "Goal not found" }); return; }
    res.json(updated);
  }
);

// ───────────────────────────────────────────────────────────────
// APPOINTMENTS  GET/POST /v1/psychologist/appointments
// ───────────────────────────────────────────────────────────────
router.get(
  "/v1/psychologist/appointments",
  authMiddleware,
  psychOnly as any,
  (req: AuthRequest, res: Response) => {
    const appointments = dbGetAppointmentsByPsychologist(req.userId!);
    res.json({ appointments });
  }
);

router.post(
  "/v1/psychologist/appointments",
  authMiddleware,
  psychOnly as any,
  (req: AuthRequest, res: Response) => {
    const psychId = req.userId!;
    const { clientId, sessionType = "followup", dateTime, notes = "" } = req.body;
    if (!clientId || !dateTime) { res.status(400).json({ error: "clientId and dateTime required" }); return; }
    if (!dbIsClientOfPsychologist(psychId, clientId)) { res.status(403).json({ error: "Not your client" }); return; }

    const client = dbGetUser(clientId);
    const appt: Appointment = {
      id: `appt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      psychologistId: psychId,
      clientId,
      clientName: client?.name ?? "Unknown",
      sessionType,
      dateTime,
      notes,
      createdAt: new Date().toISOString(),
    };
    dbCreateAppointment(appt);
    res.status(201).json(appt);
  }
);

// ───────────────────────────────────────────────────────────────
// USER UPCOMING APPOINTMENT  GET /v1/appointments/upcoming
// ───────────────────────────────────────────────────────────────
router.get(
  "/v1/appointments/upcoming",
  authMiddleware,
  (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const now = new Date();
    const upcoming = dbGetAppointmentsByClient(userId)
      .filter((a) => new Date(a.dateTime) > now)
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
    const next = upcoming[0] ?? null;
    res.json({ appointment: next });
  }
);

// ───────────────────────────────────────────────────────────────
// WEEKLY REPORT  GET /v1/psychologist/reports
// ───────────────────────────────────────────────────────────────
router.get(
  "/v1/psychologist/reports",
  authMiddleware,
  psychOnly as any,
  (req: AuthRequest, res: Response) => {
    const psychId = req.userId!;
    const clientIds = dbGetClientsByPsychologist(psychId);
    const range = (req.query.range as string) ?? "week";

    const now = Date.now();
    const dayMs = 86400000;
    const start = range === "month" ? now - 30 * dayMs : range === "lastweek" ? now - 14 * dayMs : now - 7 * dayMs;
    const end = range === "lastweek" ? now - 7 * dayMs : now;

    const reports = clientIds.map((clientId) => {
      const client = dbGetUser(clientId);
      if (!client) return null;

      const entries = dbGetMoodEntries(clientId).filter((e) => {
        const t = new Date(e.createdAt).getTime();
        return t >= start && t <= end;
      });

      const avgMood = entries.length
        ? (entries.reduce((s, e) => s + e.moodScore, 0) / entries.length).toFixed(1)
        : null;

      const emotionCounts = new Map<string, number>();
      entries.forEach((e) => e.emotions.forEach((em) => emotionCounts.set(em, (emotionCounts.get(em) ?? 0) + 1)));
      const topEmotions = Array.from(emotionCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([e]) => e);

      const allTasks = dbGetUserTasks(clientId);
      const completedTasks = allTasks.filter((t) => t.completedAt && new Date(t.completedAt).getTime() >= start);

      const checkInRate = Math.round((entries.length / 7) * 100);

      const insight = avgMood === null ? "No data this period." :
        Number(avgMood) >= 7 ? `Positive week — mood averaging ${avgMood}/10.` :
        Number(avgMood) >= 5 ? `Moderate week — mood at ${avgMood}/10, stable overall.` :
        `Challenging week — mood at ${avgMood}/10, consider checking in.`;

      return {
        clientId,
        clientName: client.name,
        avgMood,
        checkInRate,
        checkIns: entries.length,
        tasksCompleted: completedTasks.length,
        topEmotions,
        insight,
      };
    }).filter(Boolean);

    const totalCheckIns = reports.reduce((s: number, r: any) => s + r.checkIns, 0);
    const mostImproved = [...reports].sort((a: any, b: any) => Number(b.avgMood ?? 0) - Number(a.avgMood ?? 0))[0];
    const overallAvg = reports.filter((r: any) => r.avgMood !== null).length
      ? (reports.filter((r: any) => r.avgMood !== null).reduce((s: number, r: any) => s + Number(r.avgMood), 0) / reports.filter((r: any) => r.avgMood !== null).length).toFixed(1)
      : null;

    res.json({
      reports,
      overview: { totalCheckIns, mostImproved: mostImproved?.clientName ?? null, overallAvgMood: overallAvg, clientCount: clientIds.length },
      range,
    });
  }
);

export default router;
