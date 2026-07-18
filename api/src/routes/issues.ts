// routes/issues.ts
import { Router } from 'express';
import prisma from '../config/prisma.js';
import { protect, AuthRequest } from '../middleware/auth.js';
import { emitToProject } from '../../../api/src/socket.js';
import { notifyUser } from '../../../api/src/services/notification.service.js';

const router = Router();

const ISSUE_INCLUDE = {
    status: { select: { id: true, name: true, color: true, category: true } },
    assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
    reporter: { select: { id: true, name: true, email: true, avatarUrl: true } },
};

// ── Helper Functions ─────────────────────────────────────────────

async function getNextPosition(projectId: string, statusId: string): Promise<number> {
    const last = await prisma.issue.findFirst({
        where: { projectId, statusId, deletedAt: null },
        orderBy: { position: "desc" },
        select: { position: true },
    });
    return last ? last.position + 1000 : 1000;
}

async function generateIssueKey(projectId: string, projectKey: string): Promise<string> {
    const lastIssue = await prisma.issue.findFirst({
        where: { projectId },
        orderBy: { createdAt: "desc" },
        select: { key: true },
    });

    if (!lastIssue) return `${projectKey}-1`;

    const match = lastIssue.key.match(/-(\d+)$/);
    const lastNum = match ? parseInt(match[1], 10) : 0;
    return `${projectKey}-${lastNum + 1}`;
}

// ── CREATE ISSUE ─────────────────────────────────────────────────
router.post('/create', protect, async (req: any, res) => {
    try {
        const {
            projectId,
            title,
            description,
            type = "TASK",
            priority = "MEDIUM",
            statusId,
            assigneeId,
            storyPoints,
            dueDate,
        } = req.body;

        // Validation
        if (!projectId || typeof projectId !== "string") {
            return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "projectId is required." } });
        }
        if (!title || typeof title !== "string" || title.trim().length < 2) {
            return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Title must be at least 2 characters." } });
        }
        if (title.trim().length > 255) {
            return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Title must be 255 characters or fewer." } });
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true, key: true },
        });
        if (!project) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Project not found." } });

        // Check membership
        const membership = await prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId: req.user.userId } },
        });
        if (!membership) {
            return res.status(403).json({ error: { code: "FORBIDDEN", message: "You are not a member of this project." } });
        }

        // Resolve status
        let resolvedStatusId = statusId;
        if (!resolvedStatusId) {
            const defaultStatus = await prisma.status.findFirst({
                where: { projectId, isDefault: true },
                select: { id: true },
            });
            if (!defaultStatus) return res.status(404).json({ error: { code: "NOT_FOUND", message: "No default status found." } });
            resolvedStatusId = defaultStatus.id;
        }

        // Generate key + position
        const [issueKey, position] = await Promise.all([
            generateIssueKey(projectId, project.key),
            getNextPosition(projectId, resolvedStatusId),
        ]);

        const issue = await prisma.issue.create({
            data: {
                key: issueKey,
                title: title.trim(),
                description: description ?? null,
                type,
                priority,
                position,
                storyPoints: storyPoints ?? null,
                dueDate: dueDate ? new Date(dueDate) : null,
                projectId,
                statusId: resolvedStatusId,
                reporterId: req.user.userId,
                assigneeId: assigneeId ?? null,
            },
            include: ISSUE_INCLUDE,
        });

        emitToProject(projectId, "issue:created", issue);

        if (issue.assigneeId && issue.assigneeId !== req.user.userId) {
            notifyUser(
                issue.assigneeId,
                "New task assigned",
                `You were assigned to ${issue.key}: ${issue.title}`
            ).catch((err) => console.error("[createIssue] notify failed", err));
        }

        return res.status(201).json({ data: issue, success: true, message: "Issue created successfully." });

    } catch (error: any) {
        console.error("[createIssue]", error);
        return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } });
    }
});

// ── GET ISSUES ───────────────────────────────────────────────────
router.get('/', protect, async (req: any, res) => {
    try {
        const { projectId, statusId, assigneeId, type, priority, q } = req.query;

        if (!projectId) {
            return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "projectId is required." } });
        }

        const membership = await prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId: projectId as string, userId: req.user.userId } },
        });
        if (!membership) {
            return res.status(403).json({ error: { code: "FORBIDDEN", message: "You are not a member of this project." } });
        }

        const issues = await prisma.issue.findMany({
            where: {
                projectId: projectId as string,
                deletedAt: null,
                ...(statusId && { statusId: statusId as string }),
                ...(assigneeId && { assigneeId: assigneeId as string }),
                ...(type && { type: type as any }),
                ...(priority && { priority: priority as any }),
                ...(q && { title: { contains: q as string, mode: "insensitive" } }),
            },
            orderBy: { position: "asc" },
            include: ISSUE_INCLUDE,
        });

        return res.json({ data: issues, success: true });

    } catch (error: any) {
        console.error("[getIssues]", error);
        return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } });
    }
});

// ── GET SINGLE ISSUE ──────────────────────────────────────────────
router.get('/:issueId', protect, async (req: any, res) => {
    try {
        const { issueId } = req.params;

        const issue = await prisma.issue.findUnique({
            where: { id: issueId },
            include: {
                ...ISSUE_INCLUDE,
                project: { select: { id: true, name: true, key: true } },
                comments: {
                    orderBy: { createdAt: "asc" },
                    include: { author: { select: { id: true, name: true, email: true, avatarUrl: true } } },
                },
            },
        });
        if (!issue || issue.deletedAt) {
            return res.status(404).json({ error: { code: "NOT_FOUND", message: "Issue not found." } });
        }

        const membership = await prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId: issue.projectId, userId: req.user.userId } },
        });
        if (!membership) {
            return res.status(403).json({ error: { code: "FORBIDDEN", message: "You are not a member of this project." } });
        }

        return res.json({ data: issue, success: true });

    } catch (error: any) {
        console.error("[getIssueById]", error);
        return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } });
    }
});

// ── MOVE ISSUE (Drag & Drop) ─────────────────────────────────────
router.patch('/move', protect, async (req: AuthRequest, res) => {
    try {
        const { issueId, statusId, position } = req.body;

        if (!issueId || !statusId) {
            return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "issueId and statusId are required." } });
        }

        const issue = await prisma.issue.findUnique({
            where: { id: issueId },
            select: { id: true, projectId: true, deletedAt: true, statusId: true },
        });
        if (!issue || issue.deletedAt) {
            return res.status(404).json({ error: { code: "NOT_FOUND", message: "Issue not found." } });
        }

        const membership = await prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId: issue.projectId, userId: req.user!.userId } },
        });
        if (!membership) {
            return res.status(403).json({ error: { code: "FORBIDDEN", message: "You are not a member of this project." } });
        }

        const status = await prisma.status.findFirst({ where: { id: statusId, projectId: issue.projectId } });
        if (!status) {
            return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "statusId does not belong to this project." } });
        }

        const resolvedPosition = position ?? await getNextPosition(issue.projectId, statusId);

        const updated = await prisma.issue.update({
            where: { id: issueId },
            data: { statusId, position: resolvedPosition, updatedAt: new Date() },
            include: ISSUE_INCLUDE,
        });

        emitToProject(issue.projectId, "issue:moved", updated);

        return res.json({ data: updated, success: true });

    } catch (error: any) {
        console.error("[moveIssue]", error);
        return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } });
    }
});

// ── UPDATE ISSUE (partial update) ─────────────────────────────────
router.patch('/update', protect, async (req: AuthRequest, res) => {
    try {
        const { issueId, ...updates } = req.body;

        if (!issueId) {
            return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "issueId is required." } });
        }

        const issue = await prisma.issue.findUnique({
            where: { id: issueId },
            select: { id: true, projectId: true, deletedAt: true, assigneeId: true },
        });
        if (!issue || issue.deletedAt) {
            return res.status(404).json({ error: { code: "NOT_FOUND", message: "Issue not found." } });
        }

        const membership = await prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId: issue.projectId, userId: req.user!.userId } },
        });
        if (!membership) {
            return res.status(403).json({ error: { code: "FORBIDDEN", message: "You are not a member of this project." } });
        }

        const allowedFields = ["title", "description", "type", "priority", "assigneeId", "storyPoints", "dueDate", "statusId"];
        const safeUpdates: Record<string, any> = {};
        for (const field of allowedFields) {
            if (updates[field] !== undefined) safeUpdates[field] = updates[field];
        }

        if (safeUpdates.title && safeUpdates.title.trim().length < 2) {
            return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Title must be at least 2 characters." } });
        }
        if (safeUpdates.dueDate) safeUpdates.dueDate = new Date(safeUpdates.dueDate);

        const updated = await prisma.issue.update({
            where: { id: issueId },
            data: { ...safeUpdates, updatedAt: new Date() },
            include: ISSUE_INCLUDE,
        });

        emitToProject(issue.projectId, "issue:updated", updated);

        // Notify newly assigned user (assignment changed to someone new)
        const newAssignee = safeUpdates.assigneeId;
        if (newAssignee && newAssignee !== issue.assigneeId && newAssignee !== req.user!.userId) {
            notifyUser(
                newAssignee,
                "New task assigned",
                `You were assigned to ${updated.key}: ${updated.title}`
            ).catch((err) => console.error("[updateIssue] notify failed", err));
        }

        return res.json({ data: updated, success: true });

    } catch (error: any) {
        console.error("[updateIssue]", error);
        return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } });
    }
});

// ── DELETE ISSUE (soft delete) ─────────────────────────────────────
router.post('/delete', protect, async (req: AuthRequest, res) => {
    try {
        const { issueId } = req.body;

        if (!issueId) {
            return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "issueId is required." } });
        }

        const issue = await prisma.issue.findUnique({
            where: { id: issueId },
            select: { id: true, projectId: true, deletedAt: true },
        });
        if (!issue || issue.deletedAt) {
            return res.status(404).json({ error: { code: "NOT_FOUND", message: "Issue not found." } });
        }

        const membership = await prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId: issue.projectId, userId: req.user!.userId } },
        });
        if (!membership) {
            return res.status(403).json({ error: { code: "FORBIDDEN", message: "You are not a member of this project." } });
        }

        await prisma.issue.update({
            where: { id: issueId },
            data: { deletedAt: new Date() },
        });

        emitToProject(issue.projectId, "issue:deleted", { issueId });

        return res.json({ success: true, message: "Issue deleted." });

    } catch (error: any) {
        console.error("[deleteIssue]", error);
        return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." } });
    }
});

export default router;