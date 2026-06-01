import {
  dbGetMoodEntries,
  dbGetAllTasks,
  dbGetClientsByPsychologist,
  dbGetUser,
  dbGetAllUsers,
  dbGetPsychologistForClient,
  dbCreateAlert,
  dbHasRecentAlert,
  dbGetPushToken,
  dbGetPushTokensForClients,
  type RiskAlert,
} from "./db";
import { emitAlert } from "./socket";
import { sendPush } from "./pushNotification";
import { logger } from "./logger";

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

function createAndEmitAlert(
  data: Omit<RiskAlert, "id" | "createdAt" | "reviewed">,
): RiskAlert {
  const alert: RiskAlert = {
    ...data,
    id: uid(),
    reviewed: false,
    createdAt: new Date().toISOString(),
  };
  dbCreateAlert(alert);
  emitAlert(data.psychologistId, alert);

  // Push notification to psychologist
  const psychToken = dbGetPushToken(data.psychologistId);
  sendPush(
    psychToken,
    `⚠️ Risk alert: ${data.clientName}`,
    data.message,
    { type: "alert", clientId: data.clientId },
  ).catch(() => {});

  logger.info({ alertId: alert.id, type: alert.type, clientId: alert.clientId }, "Risk alert created");
  return alert;
}

export function runRiskEngine(): void {
  const now = Date.now();
  const dayMs = 86400000;

  // Get all users with psychologists
  const allUsers = dbGetAllUsers().filter((u) => u.role === "user");

  for (const user of allUsers) {
    const psychId = dbGetPsychologistForClient(user.id);
    if (!psychId) continue;

    const entries = dbGetMoodEntries(user.id);

    const lastEntry = entries[0];
    const daysSinceLast = lastEntry
      ? Math.floor((now - new Date(lastEntry.createdAt).getTime()) / dayMs)
      : 999;

    // Rule 1: No check-in for 3+ days
    if (daysSinceLast >= 3 && !dbHasRecentAlert(psychId, user.id, "no_checkin")) {
      createAndEmitAlert({
        psychologistId: psychId,
        clientId: user.id,
        clientName: user.name,
        type: "no_checkin",
        message: `No check-in for ${daysSinceLast} days`,
        severity: daysSinceLast >= 7 ? "high" : "medium",
      });
    }

    // Rule 2: Mood ≤ 3 for last 3 entries
    const last3 = entries.slice(0, 3);
    if (
      last3.length === 3 &&
      last3.every((e) => e.moodScore <= 3) &&
      !dbHasRecentAlert(psychId, user.id, "mood_drop")
    ) {
      createAndEmitAlert({
        psychologistId: psychId,
        clientId: user.id,
        clientName: user.name,
        type: "mood_drop",
        message: `Mood score ≤ 3 for the last ${last3.length} entries`,
        severity: "high",
      });
    }

    // Rule 3: Distress emotions detected
    const distress = ["Overwhelmed", "Hopeless", "Panicking", "Terrified", "Crisis"];
    const recentDistress = entries
      .slice(0, 2)
      .some((e) => e.emotions.some((em) => distress.includes(em)));
    if (recentDistress && !dbHasRecentAlert(psychId, user.id, "distress_emotion")) {
      createAndEmitAlert({
        psychologistId: psychId,
        clientId: user.id,
        clientName: user.name,
        type: "distress_emotion",
        message: "Distress indicator detected in recent mood entry",
        severity: "high",
      });
    }

    // Rule 4: Overdue tasks (3+ days overdue per spec)
    const overdue = dbGetAllTasks().filter(
      (t) =>
        t.userId === user.id &&
        !t.completedAt &&
        t.dueDate &&
        (now - new Date(t.dueDate).getTime()) > 3 * dayMs,
    );
    if (overdue.length > 0 && !dbHasRecentAlert(psychId, user.id, "task_overdue")) {
      createAndEmitAlert({
        psychologistId: psychId,
        clientId: user.id,
        clientName: user.name,
        type: "task_overdue",
        message: `${overdue.length} assigned task${overdue.length > 1 ? "s" : ""} overdue`,
        severity: "medium",
      });
    }
  }
}

export function startRiskEngine(): void {
  runRiskEngine();
  setInterval(runRiskEngine, 60 * 60 * 1000);
  logger.info("Risk engine started (runs every hour)");
}
