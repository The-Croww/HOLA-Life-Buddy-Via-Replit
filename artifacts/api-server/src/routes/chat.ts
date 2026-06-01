import { Router, Request, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import {
  dbGetUser,
  dbGetPsychologistForClient,
  dbGetClientsByPsychologist,
  dbAddDirectMessage,
  dbGetDirectMessages,
  dbMarkMessagesRead,
  dbGetUnreadCount,
  dbGetPushToken,
  type DirectMessage,
} from "../lib/db";
import { emitMessage } from "../lib/socket";
import { sendPush } from "../lib/pushNotification";

const router = Router();

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are HOLA Buddy, a warm, non-judgmental AI wellness companion inside the HOLA! Life Buddy app. You support users with evidence-based techniques drawn from CBT (Cognitive Behavioral Therapy) and DBT (Dialectical Behavior Therapy). Your tone is friendly, calm, and encouraging — like a caring friend who also knows psychology. Keep responses concise (2–4 sentences max unless guiding an exercise). Never diagnose. Always encourage professional help for serious concerns. When a user seems in crisis, gently direct them to their psychologist or a helpline. You can guide breathing exercises, suggest journaling prompts, help reframe negative thoughts, and celebrate small wins. Always validate feelings before offering techniques.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ── AI Chat (HOLA Buddy) ──────────────────────────────────────
router.post(
  "/v1/chat",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { messages } = req.body as { messages: ChatMessage[] };

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "messages array is required" });
      }

      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("Groq error:", err);
        return res.status(502).json({ error: "AI service unavailable" });
      }

      const data = await response.json();
      const text =
        data.choices?.[0]?.message?.content ??
        "I'm here with you. Could you tell me more?";

      return res.json({ message: { role: "assistant", content: text } });
    } catch (err) {
      console.error("Chat error:", err);
      return res.status(500).json({ error: "Failed to get response" });
    }
  },
);

// ── Direct Messages (Psychologist ↔ Client) ───────────────────
router.get(
  "/v1/messages",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const user = dbGetUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      let otherId: string;

      if (user.role === "user") {
        otherId = dbGetPsychologistForClient(userId) ?? "";
        if (!otherId)
          return res.status(404).json({ error: "No psychologist linked" });
      } else if (user.role === "psychologist") {
        otherId = req.query.clientId as string;
        if (!otherId)
          return res.status(400).json({ error: "clientId required" });
      } else {
        return res.status(403).json({ error: "Invalid role" });
      }

      const messages = dbGetDirectMessages(userId, otherId);
      return res.json({ messages, otherUser: dbGetUser(otherId) });
    } catch (err) {
      console.error("Get messages error:", err);
      return res.status(500).json({ error: "Failed to get messages" });
    }
  },
);

// POST /v1/messages/read — mark incoming messages as read
router.post(
  "/v1/messages/read",
  authMiddleware,
  (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const user = dbGetUser(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.role === "user") {
      const psychId = dbGetPsychologistForClient(userId);
      if (psychId) dbMarkMessagesRead(userId, psychId);
    } else if (user.role === "psychologist") {
      const { clientId } = req.body as { clientId?: string };
      if (clientId) dbMarkMessagesRead(userId, clientId);
    }
    return res.json({ ok: true });
  },
);

// GET /v1/messages/unread-count
router.get(
  "/v1/messages/unread-count",
  authMiddleware,
  (req: AuthRequest, res: Response) => {
    return res.json({ count: dbGetUnreadCount(req.userId!) });
  },
);

router.post(
  "/v1/messages",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const user = dbGetUser(userId);
      if (!user) return res.status(404).json({ error: "User not found" });

      const { content, recipientId } = req.body as {
        content: string;
        recipientId?: string;
      };

      if (!content?.trim())
        return res.status(400).json({ error: "Content required" });

      let recipient: string;

      if (user.role === "user") {
        recipient = dbGetPsychologistForClient(userId) ?? "";
        if (!recipient)
          return res.status(404).json({ error: "No psychologist linked" });
      } else if (user.role === "psychologist") {
        if (!recipientId)
          return res.status(400).json({ error: "recipientId required" });
        recipient = recipientId;
      } else {
        return res.status(403).json({ error: "Invalid role" });
      }

      const senderRole = user.role as "user" | "psychologist";
      const recipientRole: "user" | "psychologist" = senderRole === "user" ? "psychologist" : "user";

      const msg: DirectMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        senderId: userId,
        senderRole,
        recipientId: recipient,
        content: content.trim(),
        read: false,
        createdAt: new Date().toISOString(),
      };

      dbAddDirectMessage(msg);

      // Emit real-time socket event to recipient
      emitMessage(recipient, recipientRole, msg);

      // Push notification to recipient
      const recipientToken = dbGetPushToken(recipient);
      if (recipientToken) {
        const senderName = user.name ?? (senderRole === "psychologist" ? "Your psychologist" : "Your client");
        sendPush(recipientToken, `New message from ${senderName}`, content.trim().slice(0, 100), { type: "message" }).catch(() => {});
      }

      return res.json({ message: msg });
    } catch (err) {
      console.error("Send message error:", err);
      return res.status(500).json({ error: "Failed to send message" });
    }
  },
);

// Get all clients for a psychologist (with last message preview)
router.get(
  "/v1/messages/clients",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const user = dbGetUser(userId);
      if (!user || user.role !== "psychologist") {
        return res.status(403).json({ error: "Psychologists only" });
      }

      const clientIds = dbGetClientsByPsychologist(userId);
      const clients = clientIds.map((id) => {
        const client = dbGetUser(id);
        const messages = dbGetDirectMessages(id, userId);
        const lastMsg = messages[messages.length - 1];
        const unread = messages.filter(
          (m) => m.recipientId === userId && !m.read,
        ).length;
        return {
          id,
          name: client?.name ?? "Unknown",
          email: client?.email ?? "",
          lastMessage: lastMsg?.content ?? null,
          lastMessageAt: lastMsg?.createdAt ?? null,
          unread,
        };
      });

      return res.json({ clients });
    } catch (err) {
      console.error("Get clients error:", err);
      return res.status(500).json({ error: "Failed to get clients" });
    }
  },
);

export default router;
