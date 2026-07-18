// socket.ts
// Real-time layer: authenticated Socket.IO server sitting alongside the
// Express REST API. Clients join a room per project they view, and a
// private room keyed by their own userId for direct notifications.
import type { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "./config/prisma.js";

let io: Server | null = null;

interface AuthedSocket extends Socket {
  userId?: string;
}

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      credentials: true,
    },
  });

  // Authenticate every incoming connection using the same access token
  // used for REST calls (sent as `auth: { token }` from the client).
  io.use((socket: AuthedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.toString().replace("Bearer ", "");

      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "JWT_SECRET"
      ) as any;

      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: AuthedSocket) => {
    if (socket.userId) {
      // Private room for this user — used for notifications.
      socket.join(`user:${socket.userId}`);
    }

    // Client asks to join a project's live-update room. We verify
    // membership before letting them in.
    socket.on("project:join", async (projectId: string) => {
      if (!projectId || !socket.userId) return;
      const membership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: socket.userId } },
      });
      if (membership) {
        socket.join(`project:${projectId}`);
      }
    });

    socket.on("project:leave", (projectId: string) => {
      if (projectId) socket.leave(`project:${projectId}`);
    });

    socket.on("disconnect", () => {
      // socket.io cleans up room membership automatically
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.IO has not been initialized yet.");
  return io;
}

/** Broadcast an event to everyone currently viewing a project's board. */
export function emitToProject(projectId: string, event: string, payload: any) {
  io?.to(`project:${projectId}`).emit(event, payload);
}

/** Push an event to a single user across all their open tabs/devices. */
export function emitToUser(userId: string, event: string, payload: any) {
  io?.to(`user:${userId}`).emit(event, payload);
}
