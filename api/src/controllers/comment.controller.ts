// controllers/comment.controller.ts
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import * as CommentService from "../../../api/src/services/comment.service.js";
import * as NotificationService from "../../../api/src/services/notification.service.js";
import { emitToProject } from "../socket.js";

export const getComments = async (req: AuthRequest, res: Response) => {
  try {
    const { issueId } = req.params as any;
    const comments = await CommentService.listComments(req.user!.userId, issueId);
    return res.json({ success: true, data: comments });
  } catch (error: any) {
    console.error("[CommentController.getComments]", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const { issueId } = req.params as any;
    const { body } = req.body;

    const { comment, issue, recipients } = await CommentService.createComment(
      req.user!.userId,
      issueId,
      body
    );

    // Real-time: tell everyone looking at this project's board a new
    // comment landed on this issue.
    emitToProject(issue.projectId, "comment:created", {
      issueId,
      comment,
    });

    // Notify assignee/reporter (best-effort — never block the response on it)
    if (recipients.length) {
      NotificationService.notifyUsers(
        recipients,
        "New comment",
        `${comment.author.name ?? comment.author.email} commented on ${issue.key}: ${issue.title}`
      ).catch((err) => console.error("[CommentController.createComment] notify failed", err));
    }

    return res.status(201).json({ success: true, message: "Comment added.", data: comment });
  } catch (error: any) {
    console.error("[CommentController.createComment]", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

export const updateComment = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params as any;
    const { body } = req.body;

    const { comment, projectId } = await CommentService.updateComment(
      req.user!.userId,
      commentId,
      body
    );

    if (projectId) {
      emitToProject(projectId, "comment:updated", { comment });
    }

    return res.json({ success: true, message: "Comment updated.", data: comment });
  } catch (error: any) {
    console.error("[CommentController.updateComment]", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params as any;

    const { issueId, projectId } = await CommentService.deleteComment(
      req.user!.userId,
      commentId
    );

    if (projectId) {
      emitToProject(projectId, "comment:deleted", { issueId, commentId });
    }

    return res.json({ success: true, message: "Comment deleted." });
  } catch (error: any) {
    console.error("[CommentController.deleteComment]", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
};
