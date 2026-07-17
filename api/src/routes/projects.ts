import { Router } from "express";
import { protect } from "../middleware/auth.js";
import * as ProjectController from "../controllers/project.controller.js";

const router = Router();

// ==========================================
// PROJECT CRUD
// ==========================================

router.get("/", protect, ProjectController.getProjects);
router.post("/create", protect, ProjectController.createProject);


router.get("/:projectId", protect, ProjectController.getProjectById);

router.put("/:projectId", protect, ProjectController.updateProject);

router.delete("/:projectId", protect, ProjectController.deleteProject);

// ==========================================
// PROJECT MEMBERS
// ==========================================

router.get(
  "/:projectId/members",
  protect,
  ProjectController.getProjectMembers
);

router.post(
  "/:projectId/invite-member",
  protect,
  ProjectController.inviteMember
);

router.delete(
  "/:projectId/members/:userId",
  protect,
  ProjectController.removeMember
);

router.patch(
  "/:projectId/members/:userId/role",
  protect,
  ProjectController.changeMemberRole
);

// ==========================================
// PROJECT STATUSES
// ==========================================

router.get(
  "/:projectId/statuses",
  protect,
  ProjectController.getProjectStatuses
);

router.post(
  "/:projectId/statuses",
  protect,
  ProjectController.createStatus
);

router.put(
  "/statuses/:statusId",
  protect,
  ProjectController.updateStatus
);

router.delete(
  "/statuses/:statusId",
  protect,
  ProjectController.deleteStatus
);

router.patch(
  "/:projectId/statuses/reorder",
  protect,
  ProjectController.reorderStatuses
);

// ==========================================
// PROJECT INVITATIONS
// ==========================================

// router.post(
//   "/:projectId/invitations",
//   protect,
//   ProjectController.createInvitation
// );

// router.get(
//   "/:projectId/invitations",
//   protect,
//   ProjectController.getInvitations
// );

// router.post(
//   "/invitations/:token/accept",
//   protect,
//   ProjectController.acceptInvitation
// );

// router.post(
//   "/invitations/:token/reject",
//   protect,
//   ProjectController.rejectInvitation
// );

// router.delete(
//   "/invitations/:invitationId",
//   protect,
//   ProjectController.cancelInvitation
// );

export default router;