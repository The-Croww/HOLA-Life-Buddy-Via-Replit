import { Router } from "express";
import {
  dbGetUser,
  dbGetPsychologistForClient,
  dbGetLinkCode,
  dbDeleteLinkCode,
  dbAddClientAssignment,
  dbSetPushToken,
} from "../lib/db";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

const AFFIRMATIONS = [
  "You are capable of amazing things.",
  "Every step forward is progress.",
  "Your feelings are valid.",
  "Today is full of possibility.",
  "You are stronger than you think.",
  "Taking care of yourself is an act of strength.",
  "Small steps lead to big changes.",
  "You deserve kindness — especially from yourself.",
  "Your wellbeing matters deeply.",
  "Progress, not perfection.",
  "Be gentle with yourself today.",
  "Healing isn't linear — and that's okay.",
  "Your effort counts, even when it's invisible.",
  "Today, rest is also productive.",
];

router.get("/v1/users/me", authMiddleware, (req: AuthRequest, res) => {
  const userId = req.userId!;
  const user = dbGetUser(userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const psychId = dbGetPsychologistForClient(userId) ?? null;
  const psych = psychId ? dbGetUser(psychId) : null;
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.createdAt,
    linkedPsychologistId: psychId,
    linkedPsychologistName: psych?.name ?? null,
  });
});

router.get("/v1/affirmation", authMiddleware, (_req, res) => {
  const dayIndex = new Date().getDate() % AFFIRMATIONS.length;
  res.json({
    text: AFFIRMATIONS[dayIndex],
    date: new Date().toISOString().split("T")[0],
  });
});

// POST /v1/users/link — link user to psychologist via code
router.post("/v1/users/link", authMiddleware, (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { code } = req.body as { code?: string };

  if (!code) {
    res.status(400).json({ error: "code is required" });
    return;
  }

  const normalized = code.trim().toUpperCase();
  const linkData = dbGetLinkCode(normalized);

  if (!linkData) {
    res.status(404).json({ error: "Invalid or expired link code" });
    return;
  }

  if (Date.now() > linkData.expiresAt) {
    dbDeleteLinkCode(normalized);
    res.status(410).json({ error: "Link code has expired" });
    return;
  }

  const psychId = linkData.psychologistId;
  const psych = dbGetUser(psychId);
  if (!psych) {
    res.status(404).json({ error: "Psychologist not found" });
    return;
  }

  dbAddClientAssignment(psychId, userId);
  dbDeleteLinkCode(normalized);

  res.json({ psychologistName: psych.name, psychologistId: psychId });
});

// POST /v1/users/push-token — save Expo push token
router.post("/v1/users/push-token", authMiddleware, (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { token } = req.body as { token?: string };
  if (!token) {
    res.status(400).json({ error: "token is required" });
    return;
  }
  dbSetPushToken(userId, token);
  res.json({ ok: true });
});

export default router;
