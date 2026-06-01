import { logger } from "./logger";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
}

export async function sendPushNotifications(messages: PushMessage[]): Promise<void> {
  const valid = messages.filter((m) => m.to && m.to.startsWith("ExponentPushToken["));
  if (valid.length === 0) return;

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify(valid.length === 1 ? valid[0] : valid),
    });
    if (!res.ok) {
      const txt = await res.text();
      logger.warn({ status: res.status, txt }, "Push notification failed");
    }
  } catch (err) {
    logger.warn({ err }, "Push notification error");
  }
}

export async function sendPush(token: string | undefined | null, title: string, body: string, data?: Record<string, unknown>): Promise<void> {
  if (!token) return;
  await sendPushNotifications([{ to: token, title, body, data, sound: "default" }]);
}

export async function sendPushToMany(tokens: string[], title: string, body: string, data?: Record<string, unknown>): Promise<void> {
  const valid = tokens.filter(Boolean);
  if (valid.length === 0) return;
  await sendPushNotifications(valid.map((to) => ({ to, title, body, data, sound: "default" as const })));
}
