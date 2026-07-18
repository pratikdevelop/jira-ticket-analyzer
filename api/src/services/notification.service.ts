// services/notification.service.ts
import prisma from "../config/prisma.js";
import { emitToUser } from "../socket.js";

class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Creates a notification row for a user and pushes it over the socket
 * in real time if that user has an active connection.
 */
export async function notifyUser(
  userId: string,
  title: string,
  message: string
) {
  const notification = await prisma.notification.create({
    data: { userId, title, message },
  });

  emitToUser(userId, "notification:new", notification);

  return notification;
}

export async function notifyUsers(userIds: string[], title: string, message: string) {
  return Promise.all(userIds.map((id) => notifyUser(id, title, message)));
}

export async function listNotifications(userId: string, unreadOnly = false) {
  return prisma.notification.findMany({
    where: { userId, ...(unreadOnly ? { read: false } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function unreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}

export async function markAsRead(userId: string, notificationId: string) {
  const existing = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!existing) throw new ApiError(404, "Notification not found.");
  if (existing.userId !== userId) throw new ApiError(403, "Not your notification.");

  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  return { success: true };
}
