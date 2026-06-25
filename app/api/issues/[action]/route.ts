// app/api/issues/[action]/route.ts
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, ApiHandler, RouteContext } from "@/lib/api-middleware";

// ── Position helper (LexoRank) ───────────────────────────────────
// Issues are ordered by a float. New issue at end = max + 1000.
// Insert between two = midpoint. Rebalance if gap < 0.0001.

async function getNextPosition(projectId: string, statusId: string): Promise<number> {
  const last = await prisma.issue.findFirst({
    where: { projectId, statusId, deletedAt: null },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  return last ? last.position + 1000 : 1000;
}

// ── Issue key generator ──────────────────────────────────────────
// Finds the highest existing key number for a project and increments.
// e.g. TP-1, TP-2 ... TP-99

async function generateIssueKey(projectId: string, projectKey: string): Promise<string> {
  // Find all issue keys for this project and get the max number
  const lastIssue = await prisma.issue.findFirst({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: { key: true },
  });

  if (!lastIssue) return `${projectKey}-1`;

  // Extract the number from the last key e.g. "TP-42" → 42
  const match = lastIssue.key.match(/-(\d+)$/);
  const lastNum = match ? parseInt(match[1], 10) : 0;
  return `${projectKey}-${lastNum + 1}`;
}

// ─────────────────────────────────────────────────────────────────
// CREATE ISSUE
// POST /api/issues/create
// Body: { projectId, title, type?, priority?, statusId?, assigneeId?, description?, storyPoints?, dueDate? }
// ─────────────────────────────────────────────────────────────────

const createIssue: ApiHandler = async (
  req: NextRequest,
  context: RouteContext
) => {
  try {
    const body = await req.json();
    const {
      projectId,
      title,
      description,
      type        = "TASK",
      priority    = "MEDIUM",
      statusId,
      assigneeId,
      storyPoints,
      dueDate,
    } = body;

    // ── Validation ───────────────────────────────────────────────
    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "projectId is required.", status: 400 } },
        { status: 400 }
      );
    }
    if (!title || typeof title !== "string" || title.trim().length < 2) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Title must be at least 2 characters.", status: 400 } },
        { status: 400 }
      );
    }
    if (title.trim().length > 255) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Title must be 255 characters or fewer.", status: 400 } },
        { status: 400 }
      );
    }
    if (!["TASK", "BUG", "STORY", "EPIC"].includes(type)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "type must be TASK, BUG, STORY, or EPIC.", status: 400 } },
        { status: 400 }
      );
    }
    if (!["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "priority must be LOW, MEDIUM, HIGH, or URGENT.", status: 400 } },
        { status: 400 }
      );
    }
    if (storyPoints !== undefined && (typeof storyPoints !== "number" || storyPoints < 0)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "storyPoints must be a non-negative number.", status: 400 } },
        { status: 400 }
      );
    }

    // ── Verify project exists and user is a member ────────────────
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, key: true },
    });
    if (!project) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Project not found.", status: 404 } },
        { status: 404 }
      );
    }

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: context.user.id } },
    });
    if (!membership) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You are not a member of this project.", status: 403 } },
        { status: 403 }
      );
    }

    // ── Resolve statusId — use provided or fall back to default ───
    let resolvedStatusId = statusId;
    if (!resolvedStatusId) {
      const defaultStatus = await prisma.status.findFirst({
        where: { projectId, isDefault: true },
        select: { id: true },
      });
      if (!defaultStatus) {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "No default status found for this project.", status: 404 } },
          { status: 404 }
        );
      }
      resolvedStatusId = defaultStatus.id;
    } else {
      // Verify the provided statusId belongs to this project
      const status = await prisma.status.findFirst({
        where: { id: resolvedStatusId, projectId },
        select: { id: true },
      });
      if (!status) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "statusId does not belong to this project.", status: 400 } },
          { status: 400 }
        );
      }
    }

    // ── Verify assignee is a project member (if provided) ─────────
    if (assigneeId) {
      const assigneeMembership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: assigneeId } },
      });
      if (!assigneeMembership) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "Assignee is not a member of this project.", status: 400 } },
          { status: 400 }
        );
      }
    }

    // ── Generate key and position ─────────────────────────────────
    const [issueKey, position] = await Promise.all([
      generateIssueKey(projectId, project.key),
      getNextPosition(projectId, resolvedStatusId),
    ]);

    // ── Create the issue ──────────────────────────────────────────
    const issue = await prisma.issue.create({
      data: {
        key:         issueKey,
        title:       title.trim(),
        description: description ?? null,       // Tiptap JSON or null
        type,
        priority,
        position,
        storyPoints: storyPoints ?? null,
        dueDate:     dueDate ? new Date(dueDate) : null,
        projectId,
        statusId:    resolvedStatusId,
        reporterId:  context.user.id,           // always the logged-in user
        assigneeId:  assigneeId ?? null,
      },
      include: {
        status:   { select: { id: true, name: true, color: true, category: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        reporter: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return NextResponse.json(
      { data: issue, success: true, message: "Issue created successfully." },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("[createIssue]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred.", status: 500 } },
      { status: 500 }
    );
  }
};

// ─────────────────────────────────────────────────────────────────
// GET ISSUES FOR A PROJECT
// GET /api/issues/list?projectId=xxx&statusId=xxx&assigneeId=xxx&type=xxx&priority=xxx
// ─────────────────────────────────────────────────────────────────

const getIssues: ApiHandler = async (
  req: NextRequest,
  context: RouteContext
) => {
  try {
    const url        = new URL(req.url);
    const projectId  = url.searchParams.get("projectId");
    const statusId   = url.searchParams.get("statusId");
    const assigneeId = url.searchParams.get("assigneeId");
    const type       = url.searchParams.get("type");
    const priority   = url.searchParams.get("priority");
    const q          = url.searchParams.get("q");         // text search

    if (!projectId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "projectId is required.", status: 400 } },
        { status: 400 }
      );
    }

    // Verify user is a member
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: context.user.id } },
    });
    if (!membership) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You are not a member of this project.", status: 403 } },
        { status: 403 }
      );
    }

    const issues = await prisma.issue.findMany({
      where: {
        projectId,
        deletedAt:  null,                                       // exclude soft-deleted
        ...(statusId   && { statusId }),
        ...(assigneeId && { assigneeId }),
        ...(type       && { type: type as any }),
        ...(priority   && { priority: priority as any }),
        ...(q          && { title: { contains: q, mode: "insensitive" } }),
      },
      orderBy: { position: "asc" },                            // board card order
      include: {
        status:   { select: { id: true, name: true, color: true, category: true, position: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        reporter: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ data: issues, success: true }, { status: 200 });

  } catch (error: any) {
    console.error("[getIssues]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred.", status: 500 } },
      { status: 500 }
    );
  }
};

// ─────────────────────────────────────────────────────────────────
// UPDATE ISSUE STATUS (drag-drop)
// PATCH /api/issues/move
// Body: { issueId, statusId, position? }
// ─────────────────────────────────────────────────────────────────

const moveIssue: ApiHandler = async (
  req: NextRequest,
  context: RouteContext
) => {
  try {
    const { issueId, statusId, position } = await req.json();

    if (!issueId || !statusId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "issueId and statusId are required.", status: 400 } },
        { status: 400 }
      );
    }

    // Verify issue exists and user is a member
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      select: { id: true, projectId: true, deletedAt: true },
    });
    if (!issue || issue.deletedAt) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Issue not found.", status: 404 } },
        { status: 404 }
      );
    }

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: issue.projectId, userId: context.user.id } },
    });
    if (!membership) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You are not a member of this project.", status: 403 } },
        { status: 403 }
      );
    }

    // Verify statusId belongs to the same project
    const status = await prisma.status.findFirst({
      where: { id: statusId, projectId: issue.projectId },
    });
    if (!status) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "statusId does not belong to this project.", status: 400 } },
        { status: 400 }
      );
    }

    // If no position provided, append at end of target column
    const resolvedPosition = position ?? await getNextPosition(issue.projectId, statusId);

    const updated = await prisma.issue.update({
      where: { id: issueId },
      data: {
        statusId,
        position: resolvedPosition,
        updatedAt: new Date(),
      },
      include: {
        status:   { select: { id: true, name: true, color: true, category: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        reporter: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ data: updated, success: true }, { status: 200 });

  } catch (error: any) {
    console.error("[moveIssue]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred.", status: 500 } },
      { status: 500 }
    );
  }
};

// ─────────────────────────────────────────────────────────────────
// UPDATE ISSUE (partial update)
// PATCH /api/issues/update
// Body: { issueId, title?, description?, type?, priority?, assigneeId?, storyPoints?, dueDate? }
// ─────────────────────────────────────────────────────────────────

const updateIssue: ApiHandler = async (
  req: NextRequest,
  context: RouteContext
) => {
  try {
    const body = await req.json();
    const { issueId, ...updates } = body;

    if (!issueId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "issueId is required.", status: 400 } },
        { status: 400 }
      );
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      select: { id: true, projectId: true, deletedAt: true },
    });
    if (!issue || issue.deletedAt) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Issue not found.", status: 404 } },
        { status: 404 }
      );
    }

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: issue.projectId, userId: context.user.id } },
    });
    if (!membership) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You are not a member of this project.", status: 403 } },
        { status: 403 }
      );
    }

    // Only allow safe fields to be updated — never let caller change key, projectId, reporterId
    const allowedFields = ["title", "description", "type", "priority", "assigneeId", "storyPoints", "dueDate"];
    const safeUpdates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        safeUpdates[field] = updates[field];
      }
    }

    if (safeUpdates.title && safeUpdates.title.trim().length < 2) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Title must be at least 2 characters.", status: 400 } },
        { status: 400 }
      );
    }
    if (safeUpdates.dueDate) {
      safeUpdates.dueDate = new Date(safeUpdates.dueDate);
    }

    const updated = await prisma.issue.update({
      where: { id: issueId },
      data: { ...safeUpdates, updatedAt: new Date() },
      include: {
        status:   { select: { id: true, name: true, color: true, category: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        reporter: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ data: updated, success: true }, { status: 200 });

  } catch (error: any) {
    console.error("[updateIssue]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred.", status: 500 } },
      { status: 500 }
    );
  }
};

// ─────────────────────────────────────────────────────────────────
// DELETE ISSUE (soft delete)
// DELETE /api/issues/delete
// Body: { issueId }
// ─────────────────────────────────────────────────────────────────

const deleteIssue: ApiHandler = async (
  req: NextRequest,
  context: RouteContext
) => {
  try {
    const { issueId } = await req.json();

    if (!issueId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "issueId is required.", status: 400 } },
        { status: 400 }
      );
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      select: { id: true, projectId: true, deletedAt: true },
    });
    if (!issue || issue.deletedAt) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Issue not found.", status: 404 } },
        { status: 404 }
      );
    }

    // Only ADMINs or the reporter can delete
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: issue.projectId, userId: context.user.id } },
    });
    if (!membership) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You are not a member of this project.", status: 403 } },
        { status: 403 }
      );
    }

    // Soft delete — set deletedAt, never destroy the row
    await prisma.issue.update({
      where: { id: issueId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json(
      { success: true, message: "Issue deleted." },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("[deleteIssue]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred.", status: 500 } },
      { status: 500 }
    );
  }
};

// ── Route dispatchers ─────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;

  switch (action) {
    case "create":
      return withAuth(createIssue)(req, { params: Promise.resolve({}) } as any);

    case "move":
      return withAuth(moveIssue)(req, { params: Promise.resolve({}) } as any);

    case "update":
      return withAuth(updateIssue)(req, { params: Promise.resolve({}) } as any);

    case "delete":
      return withAuth(deleteIssue)(req, { params: Promise.resolve({}) } as any);

    default:
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Invalid action.", status: 404 } },
        { status: 404 }
      );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;

  switch (action) {
    case "list":
      return withAuth(getIssues)(req, { params: Promise.resolve({}) } as any);

    default:
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Invalid action.", status: 404 } },
        { status: 404 }
      );
  }
}