import { Router } from "express";
import { dbGetJournalEntries, dbAddJournalEntry, dbUpdateJournalEntry, dbDeleteJournalEntry, type JournalEntry } from "../lib/db";
import { authMiddleware, type AuthRequest } from "../middleware/auth";

const router = Router();

// GET /v1/journal
router.get("/v1/journal", authMiddleware, (req: AuthRequest, res) => {
  const entries = dbGetJournalEntries(req.userId!);
  res.json({ entries, total: entries.length });
});

// POST /v1/journal
router.post("/v1/journal", authMiddleware, (req: AuthRequest, res) => {
  const { title, body, moodTag, isShared } = req.body as {
    title?: string;
    body?: string;
    moodTag?: string;
    isShared?: boolean;
  };
  if (!body?.trim()) {
    res.status(400).json({ error: "body is required" });
    return;
  }
  const entry: JournalEntry = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
    userId: req.userId!,
    title: title?.trim() || "Untitled",
    body: body.trim(),
    moodTag: moodTag ?? null,
    isShared: isShared === true,
    createdAt: new Date().toISOString(),
  };
  dbAddJournalEntry(entry);
  res.status(201).json(entry);
});

// PATCH /v1/journal/:entryId — update isShared toggle
router.patch("/v1/journal/:entryId", authMiddleware, (req: AuthRequest, res) => {
  const updates: { isShared?: boolean } = {};
  if (typeof req.body.isShared === "boolean") {
    updates.isShared = req.body.isShared;
  }
  const updated = dbUpdateJournalEntry(req.params["entryId"] as string, req.userId!, updates);
  if (!updated) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  res.json(updated);
});

// DELETE /v1/journal/:entryId
router.delete("/v1/journal/:entryId", authMiddleware, (req: AuthRequest, res) => {
  const deleted = dbDeleteJournalEntry(req.params["entryId"] as string, req.userId!);
  if (!deleted) {
    res.status(404).json({ error: "Entry not found" });
    return;
  }
  res.status(204).send();
});

// GET /v1/journal/prompt?mood=anxious
const PROMPTS: Record<string, string[]> = {
  anxious: [
    "What's one thing that's weighing on you right now, and what's the tiniest step you could take?",
    "Describe where in your body you feel the anxiety. What might it be trying to tell you?",
    "What would you say to a friend who was feeling exactly how you feel right now?",
  ],
  sad: [
    "What's one small thing that went okay today, even if it was tiny?",
    "Who or what has given you comfort in hard times before? Can you reach for that now?",
    "Write about a moment when you felt understood. What made it feel that way?",
  ],
  angry: [
    "What happened, and what need of yours wasn't being met?",
    "If the anger could speak, what would it say?",
    "What does a fair resolution look like to you?",
  ],
  happy: [
    "What made today feel good? How can you create more of that?",
    "Who would you like to share this moment with, and why?",
    "What does this happiness tell you about what you value most?",
  ],
  calm: [
    "What helped you feel this way today? How can you protect that space?",
    "Write about a goal you've been putting off. From this calm place, how does it look?",
    "Describe the version of yourself that feels like this more often.",
  ],
  tired: [
    "What has been draining your energy most? Is any of it something you could let go of?",
    "What does rest really look like for you — not just sleep, but true rest?",
    "What would you do tomorrow if you woke up with full energy?",
  ],
  grateful: [
    "Who is someone you're grateful for today? What would you want them to know?",
    "What ordinary thing do you usually overlook but are grateful for today?",
    "How has gratitude changed something for you recently?",
  ],
  excited: [
    "What are you most excited about? What's the best possible outcome?",
    "How can you channel this energy into something meaningful today?",
    "Who do you want to bring along on this journey?",
  ],
  default: [
    "How are you feeling right now — really? Don't filter it.",
    "What's one thing you learned about yourself this week?",
    "If today had a title, what would it be?",
  ],
};

router.get("/v1/journal/prompt", authMiddleware, (req: AuthRequest, res) => {
  const mood = (req.query["mood"] as string | undefined)?.toLowerCase() ?? "default";
  const list = PROMPTS[mood] ?? PROMPTS["default"]!;
  const prompt = list[Math.floor(Math.random() * list.length)]!;
  res.json({ prompt });
});

export default router;
