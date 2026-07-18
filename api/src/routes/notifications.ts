import { Router } from "express";
import { protect } from "../middleware/auth.js";
import * as NotificationController from "../controllers/notification.controller.js";

const router = Router();

router.get("/", protect, NotificationController.getNotifications);
router.patch("/read-all", protect, NotificationController.markAllAsRead);
router.patch("/:notificationId/read", protect, NotificationController.markAsRead);

export default router;
