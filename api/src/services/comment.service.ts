// services/comment.service.ts
import prisma from "../config/prisma.js";

class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

const commentSelect = {
  id: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  issueId: true,
  authorId: true,
  author: {
    select: { id: true, name: true, email: true, avatarUrl: true },
  },
} as const;

async function assertProjectMember(userId: string, projectId: string) {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  if (!membership) {
    throw new ApiError(403, "You are not a member of this project.");
  }
  return membership;
}

async function getIssueOrThrow(issueId: string) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { id: true, projectId: true, deletedAt: true, title: true, key: true, assigneeId: true, reporterId: true },
  });
  if (!issue || issue.deletedAt) {
    throw new ApiError(404, "Issue not found.");
  }
  return issue;
}

export async function listComments(userId: string, issueId: string) {
  const issue = await getIssueOrThrow(issueId);
  await assertProjectMember(userId, issue.projectId);

  return prisma.comment.findMany({
    where: { issueId },
    orderBy: { createdAt: "asc" },
    select: commentSelect,
  });
}

export async function createComment(userId: string, issueId: string, body: string) {
  const text = (body ?? "").trim();
  if (!text) {
    throw new ApiError(400, "Comment body is required.");
  }
  if (text.length > 5000) {
    throw new ApiError(400, "Comment must be 5000 characters or fewer.");
  }

  const issue = await getIssueOrThrow(issueId);
  await assertProjectMember(userId, issue.projectId);

  const comment = await prisma.comment.create({
    data: { body: text, issueId, authorId: userId },
    select: commentSelect,
  });

  // Notify assignee + reporter (excluding the comment author) so they know someone replied.
  const recipients = new Set<string>();
  if (issue.assigneeId && issue.assigneeId !== userId) recipients.add(issue.assigneeId);
  if (issue.reporterId && issue.reporterId !== userId) recipients.add(issue.reporterId);

  return { comment, issue, recipients: Array.from(recipients) };
}

export async function updateComment(userId: string, commentId: string, body: string) {
  const text = (body ?? "").trim();
  if (!text) {
    throw new ApiError(400, "Comment body is required.");
  }

  const existing = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!existing) throw new ApiError(404, "Comment not found.");
  if (existing.authorId !== userId) throw new ApiError(403, "You can only edit your own comments.");

  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: { body: text },
    select: commentSelect,
  });

  const issue = await prisma.issue.findUnique({ where: { id: comment.issueId }, select: { projectId: true } });

  return { comment, projectId: issue?.projectId };
}

export async function deleteComment(userId: string, commentId: string) {
  const existing = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!existing) throw new ApiError(404, "Comment not found.");
  if (existing.authorId !== userId) throw new ApiError(403, "You can only delete your own comments.");

  await prisma.comment.delete({ where: { id: commentId } });

  const issue = await prisma.issue.findUnique({ where: { id: existing.issueId }, select: { projectId: true } });

  return { issueId: existing.issueId, projectId: issue?.projectId };
}
