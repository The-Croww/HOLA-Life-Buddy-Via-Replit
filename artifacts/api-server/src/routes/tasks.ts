import { Router } from "express";
import {
  dbGetTask,
  dbGetUserTasks,
  dbCompleteTask,
  dbGetPsychologistForClient,
  dbGetPushToken,
  dbGetUser,
} from "../lib/db";
import { authMiddleware, type AuthRequest } from "../middleware/auth";
import { sendPush } from "../lib/pushNotification";

const router = Router();

// GET /v1/tasks
router.get("/v1/tasks", authMiddleware, (req: AuthRequest, res) => {
  const tasks = dbGetUserTasks(req.userId!).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  res.json({ tasks });
});

// GET /v1/tasks/assigned — tasks assigned by psychologist (for home screen)
router.get("/v1/tasks/assigned", authMiddleware, (req: AuthRequest, res) => {
  const tasks = dbGetUserTasks(req.userId!).filter((t) => !t.completedAt);
  res.json({ tasks });
});

// PATCH /v1/tasks/:taskId/complete
router.patch("/v1/tasks/:taskId/complete", authMiddleware, async (req: AuthRequest, res) => {
  const task = dbGetTask(req.params["taskId"] as string);
  if (!task || task.userId !== req.userId!) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  if (task.completedAt) {
    res.json(task);
    return;
  }
  const completedAt = new Date().toISOString();
  dbCompleteTask(task.id, completedAt);
  const updated = { ...task, completedAt };

  // Notify psychologist
  const psychId = dbGetPsychologistForClient(req.userId!);
  if (psychId) {
    const psychToken = dbGetPushToken(psychId);
    const user = dbGetUser(req.userId!);
    sendPush(psychToken, "Task Completed ✅", `${user?.name ?? "Your client"} completed: ${task.title}`).catch(() => {});
  }

  res.json(updated);
});

export default router;
