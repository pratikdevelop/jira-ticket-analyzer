import { Router } from "express";
import { protect } from "../../../api/src/middleware/auth.js";
import * as CommentController from "../../../api/src/controllers/comment.controller.js";

const router = Router();

// Comments are nested under an issue.
router.get("/issue/:issueId", protect, CommentController.getComments);
router.post("/issue/:issueId", protect, CommentController.createComment);

router.put("/:commentId", protect, CommentController.updateComment);
router.delete("/:commentId", protect, CommentController.deleteComment);

export default router;
