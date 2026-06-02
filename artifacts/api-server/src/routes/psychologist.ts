import { Router, type Response, type NextFunction } from "express";
import {
  dbGetUser,
  dbGetMoodEntries,
  dbGetLinkCode,
  dbSetLinkCode,
  dbDeleteLinkCode,
  dbGetClientsByPsychologist,
  dbIsClientOfPsychologist,
  dbGetAllTasks,
  dbGetUserTasks,
  dbCreateTask,
  dbGetAlertsByPsychologist,
  dbGetAlert,
  dbMarkAlertReviewed,
  dbGetJournalEntries,
  dbGetPushToken,
  type Task,
} from "../lib/db";
import { authMiddleware, type AuthRequest } from "../middleware/auth";
import { sendPush } from "../lib/pushNotification";

const router = Router();

function psychOnly(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.userRole !== "psychologist" && req.userRole !== "admin") {
    res.status(403).json({ error: "Psychologist access required" });
    return;
  }
  next();
}

function clientSummary(clientId: string) {
  const user = dbGetUser(clientId);
  if (!user) return null;
  const now = Date.now();
  const dayMs = 86400000;
  const entries = dbGetMoodEntries(clientId);
  const recent7 = entries.filter(
    (e) => now - new Date(e.createdAt).getTime() < 7 * dayMs,
  );
  const avgMood =
    recent7.length > 0
      ? Math.round(
          (recent7.reduce((s, e) => s + e.moodScore, 0) / recent7.length) * 10,
        ) / 10
      : 0;

  const lastEntry = entries[0];
  const msAgo = lastEntry ? now - new Date(lastEntry.createdAt).getTime() : Infinity;
  const lastCheckin =
    !lastEntry ? "Never"
    : msAgo < dayMs ? "Today"
    : msAgo < 2 * dayMs ? "Yesterday"
    : `${Math.floor(msAgo / dayMs)} days ago`;

  const last3 = entries.slice(0, 3);
  const prev3 = entries.slice(3, 6);
  const avg3 = last3.length ? last3.reduce((s, e) => s + e.moodScore, 0) / last3.length : 5;
  const avgP = prev3.length ? prev3.reduce((s, e) => s + e.moodScore, 0) / prev3.length : 5;
  const trend = avg3 > avgP + 0.5 ? "up" : avg3 < avgP - 0.5 ? "down" : "neutral";
  const risk = avgMood < 4 ? "high" : avgMood < 6 ? "medium" : "low";

  const emotionCounts = new Map<string, number>();
  entries.slice(0, 5).forEach((e) =>
    e.emotions.forEach((em) => emotionCounts.set(em, (emotionCounts.get(em) ?? 0) + 1)),
  );
  const topEmotions = Array.from(emotionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([e]) => e);

  const days = new Set(entries.map((e) => new Date(e.createdAt).toDateString()));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (days.has(d.toDateString())) streak++;
    else break;
  }

  return { id: clientId, name: user.name, email: user.email, lastCheckin, avgMood, trend, risk, streak, emotions: topEmotions };
}

// POST /v1/psychologist/link-code
router.post("/v1/psychologist/link-code", authMiddleware, psychOnly, (req: AuthRequest, res) => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  dbSetLinkCode(code, { psychologistId: req.userId!, expiresAt });
  res.json({ code, expiresAt: new Date(expiresAt).toISOString() });
});

// GET /v1/psychologist/clients
router.get("/v1/psychologist/clients", authMiddleware, psychOnly, (req: AuthRequest, res) => {
  const clientIds = dbGetClientsByPsychologist(req.userId!);
  const clients = clientIds.map(clientSummary).filter(Boolean);
  res.json({ clients });
});

// GET /v1/psychologist/clients/:clientId/mood
router.get("/v1/psychologist/clients/:clientId/mood", authMiddleware, psychOnly, (req: AuthRequest, res) => {
  const clientId = req.params["clientId"] as string;
  if (!dbIsClientOfPsychologist(req.userId!, clientId)) {
    res.status(403).json({ error: "Client not assigned to you" });
    return;
  }
  const entries = dbGetMoodEntries(clientId);
  res.json({ entries, total: entries.length });
});

// POST /v1/psychologist/clients/:clientId/tasks
router.post("/v1/psychologist/clients/:clientId/tasks", authMiddleware, psychOnly, async (req: AuthRequest, res) => {
  const clientId = req.params.clientId as string;
  if (!dbIsClientOfPsychologist(req.userId!, clientId!)) {
    res.status(403).json({ error: "Client not assigned to you" });
    return;
  }
  const { title, description, dueDate } = req.body as {
    title?: string;
    description?: string;
    dueDate?: string;
  };
  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const task: Task = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
    userId: clientId!,
    psychologistId: req.userId!,
    title,
    description: description ?? "",
    dueDate: dueDate ?? null,
    completedAt: null,
    createdAt: new Date().toISOString(),
  };
  dbCreateTask(task);

  // Send push notification to client
  const clientToken = dbGetPushToken(clientId!);
  const psych = dbGetUser(req.userId!);
  sendPush(clientToken, "New task assigned 📋", `${psych?.name ?? "Your psychologist"} assigned: ${title}`, { type: "task" }).catch(() => {});

  res.status(201).json(task);
});

// GET /v1/psychologist/clients/:clientId/tasks
router.get("/v1/psychologist/clients/:clientId/tasks", authMiddleware, psychOnly, (req: AuthRequest, res) => {
  const clientId = req.params.clientId as string;
  const tasks = dbGetUserTasks(clientId!).filter((t) => t.psychologistId === req.userId!);
  res.json({ tasks });
});

// GET /v1/psychologist/alerts
router.get("/v1/psychologist/alerts", authMiddleware, psychOnly, (req: AuthRequest, res) => {
  const alerts = dbGetAlertsByPsychologist(req.userId!);
  res.json({ alerts });
});

// PATCH /v1/psychologist/alerts/:alertId/review
router.patch("/v1/psychologist/alerts/:alertId/review", authMiddleware, psychOnly, (req: AuthRequest, res) => {
  const alert = dbGetAlert(req.params["alertId"] as string);
  if (!alert || alert.psychologistId !== req.userId!) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  dbMarkAlertReviewed(alert.id);
  res.json({ ...alert, reviewed: true });
});

// GET /v1/psychologist/clients/:clientId/journal — shared entries only
router.get("/v1/psychologist/clients/:clientId/journal", authMiddleware, psychOnly, (req: AuthRequest, res) => {
  const clientId = req.params.clientId as string;
  if (!dbIsClientOfPsychologist(req.userId!, clientId!)) {
    res.status(403).json({ error: "Client not assigned to you" });
    return;
  }
  const entries = dbGetJournalEntries(clientId!).filter((e) => e.isShared);
  res.json({ entries, total: entries.length });
});

export default router;
