import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import type { RiskAlert, DirectMessage } from "../store";
import { logger } from "./logger";

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    path: "/api/socket.io",
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    const psychologistId = socket.handshake.query["psychologistId"] as string | undefined;
    const userId = socket.handshake.query["userId"] as string | undefined;

    if (psychologistId) {
      socket.join(`psych:${psychologistId}`);
      logger.info({ psychologistId }, "Admin client connected to socket");
    }

    if (userId) {
      socket.join(`user:${userId}`);
      logger.info({ userId }, "User client connected to socket");
    }

    socket.on("disconnect", () => {
      logger.info({ psychologistId, userId }, "Client disconnected");
    });
  });

  return io;
}

export function emitAlert(psychologistId: string, alert: RiskAlert): void {
  io?.to(`psych:${psychologistId}`).emit("alert", alert);
}

export function emitMessage(recipientId: string, recipientRole: "user" | "psychologist", message: DirectMessage): void {
  if (recipientRole === "psychologist") {
    io?.to(`psych:${recipientId}`).emit("new_message", message);
  } else {
    io?.to(`user:${recipientId}`).emit("new_message", message);
  }
}
