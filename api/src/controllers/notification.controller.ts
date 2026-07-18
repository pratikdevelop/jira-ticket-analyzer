// controllers/notification.controller.ts
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import * as NotificationService from "../../../api/src/services/notification.service.js";

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const unreadOnly = req.query.unread === "true";
    const notifications = await NotificationService.listNotifications(
      req.user!.userId,
      unreadOnly
    );
    const count = await NotificationService.unreadCount(req.user!.userId);
    return res.json({ success: true, data: notifications, unreadCount: count });
  } catch (error: any) {
    console.error("[NotificationController.getNotifications]", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { notificationId } = req.params as any;
    const notification = await NotificationService.markAsRead(
      req.user!.userId,
      notificationId
    );
    return res.json({ success: true, data: notification });
  } catch (error: any) {
    console.error("[NotificationController.markAsRead]", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await NotificationService.markAllAsRead(req.user!.userId);
    return res.json({ success: true, message: "All notifications marked as read." });
  } catch (error: any) {
    console.error("[NotificationController.markAllAsRead]", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};
