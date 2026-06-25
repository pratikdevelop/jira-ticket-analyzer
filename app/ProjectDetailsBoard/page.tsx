"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CreateIssueDialog from "../CreateIssueDialog";
import {
  Plus,
  MoreHorizontal,
  Bug,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Settings,
  Users,
  ChevronRight,
  Loader2,
} from "lucide-react";

import TicketDetailDialog from "../TicketDetailsDialog";

// ── Types ─────────────────────────────────────────────────────────

type Status = {
  id: string;
  name: string;
  color: string;
  position: number;
  category: "TODO" | "IN_PROGRESS" | "DONE";
  isDefault: boolean;
  projectId: string;
};

type Member = {
  role: string;
  joinedAt: string;
  projectId: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
};

type Project = {
  id: string;
  name: string;
  key: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  statuses: Status[];
  members: Member[];
};

// ✅ Fix 2: uppercase to match API/Prisma enum values exactly
type IssueType = "TASK" | "BUG" | "STORY" | "EPIC";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

type Issue = {
  id: string;
  key: string;
  title: string;
  description?: string | null;
  type: IssueType;
  priority: Priority;
  statusId: string;
  assigneeId?: string | null;
  assignee?: Member["user"] | null;
  reporter?: Member["user"] | null;
  position: number;
};

// ── Auth helper ───────────────────────────────────────────────────
// Reads JWT from localStorage — adjust key name to match your auth setup

function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") ?? "";
}

function authHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

// ── Config maps — uppercase keys match Prisma enums ───────────────

const priorityConfig: Record<Priority, { label: string; icon: React.ReactNode; color: string }> = {
  LOW: { label: "Low", icon: <ArrowDown className="w-3 h-3" />, color: "text-blue-500" },
  MEDIUM: { label: "Medium", icon: <Minus className="w-3 h-3" />, color: "text-gray-400" },
  HIGH: { label: "High", icon: <ArrowUp className="w-3 h-3" />, color: "text-orange-500" },
  URGENT: { label: "Urgent", icon: <AlertCircle className="w-3 h-3" />, color: "text-red-500" },
};

const typeConfig: Record<IssueType, { label: string; icon: React.ReactNode; color: string }> = {
  TASK: { label: "Task", icon: <CheckCircle2 className="w-3 h-3" />, color: "text-blue-500" },
  BUG: { label: "Bug", icon: <Bug className="w-3 h-3" />, color: "text-red-500" },
  STORY: { label: "Story", icon: <BookOpen className="w-3 h-3" />, color: "text-purple-500" },
  EPIC: { label: "Epic", icon: <BookOpen className="w-3 h-3" />, color: "text-pink-500" },
};

// Dot color derived from status hex color
const statusDotColor: Record<string, string> = {
  "#E2E8F0": "#94a3b8",
  "#DBEAFE": "#3b82f6",
  "#FEF3C7": "#f59e0b",
  "#DCFCE7": "#22c55e",
};

function getDotColor(hex: string): string {
  return statusDotColor[hex] ?? hex;
}

// ── Helpers ───────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string | null): string {
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-purple-100 text-purple-700",
    "bg-orange-100 text-orange-700",
    "bg-pink-100 text-pink-700",
  ];
  if (!name) return colors[0];
  return colors[name.charCodeAt(0) % colors.length];
}

// ── Issue card ────────────────────────────────────────────────────

function IssueCard({
  issue,
  members,
  onDragStart,
  onDelete,
  onViewClick,
}: {
  issue: Issue;
  members: Member[];
  onDragStart: (e: React.DragEvent, issue: Issue) => void;
  onDelete: (id: string) => void;
  onViewClick: (issue: Issue) => void;
}) {
  // Use included assignee object from API, or fall back to member lookup
  const assigneeUser =
    issue.assignee ??
    members.find((m) => m.userId === issue.assigneeId)?.user ??
    null;

  const priority = priorityConfig[issue.priority] ?? priorityConfig.MEDIUM;
  const type = typeConfig[issue.type] ?? typeConfig.TASK;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, issue)}
      className="group w-full bg-white border border-gray-200 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-gray-300 hover:shadow-sm transition-all select-none"
    >
      {/* Key + menu */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-mono text-gray-400">{issue.key}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-100">
              <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem className="text-xs">Edit issue</DropdownMenuItem>
            <DropdownMenuItem
              className="text-xs text-red-600 focus:text-red-600"
              onClick={() => onDelete(issue.id)}
            >
              Delete issue
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div
        onClick={() => onViewClick(issue)}
      >
        {/* Title */}
        {/* <s</span> */}
        <p className="text-sm text-gray-800 leading-snug mb-3 font-medium line-clamp-2">
          {issue.title}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`${type.color} flex items-center`} title={type.label}>
              {type.icon}
            </span>
            <span className={`${priority.color} flex items-center`} title={priority.label}>
              {priority.icon}
            </span>
          </div>

          {assigneeUser ? (
            <Avatar className="w-5 h-5">
              {assigneeUser.avatarUrl && <AvatarImage src={assigneeUser.avatarUrl} />}
              <AvatarFallback className={`text-[9px] font-medium ${getAvatarColor(assigneeUser.name)}`}>
                {getInitials(assigneeUser.name)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-5 h-5 rounded-full bg-gray-100 border border-dashed border-gray-300" />
          )}

        </div>

      </div>
    </div>
  );
}

// ── Board column ──────────────────────────────────────────────────

function BoardColumn({
  status,
  issues,
  members,
  onDragStart,
  onDrop,
  onAddIssue,
  onDeleteIssue,
  onViewClick,
}: {
  status: Status;
  issues: Issue[];
  members: Member[];
  onDragStart: (e: React.DragEvent, issue: Issue) => void;
  onDrop: (e: React.DragEvent, statusId: string) => void;
  onAddIssue: (statusId: string) => void;
  onDeleteIssue: (id: string) => void;
  onViewClick: (issue: Issue) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      className={`flex flex-col rounded-xl border transition-colors min-h-[200px] ${isDragOver ? "border-blue-300 bg-blue-50/60" : "border-gray-200 bg-gray-50"
        }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => { setIsDragOver(false); onDrop(e, status.id); }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-200">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: getDotColor(status.color) }}
        />
        <span className="text-xs font-semibold text-gray-700 flex-1">{status.name}</span>
        <span className="text-xs text-gray-400 bg-white border border-gray-200 rounded-full px-1.5 py-0.5 font-medium">
          {issues.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 p-2 flex-1">
        {issues.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            members={members}
            onDragStart={onDragStart}
            onDelete={onDeleteIssue}
            onViewClick={onViewClick}
          />
        ))}
        {isDragOver && issues.length === 0 && (
          <div className="border-2 border-dashed border-blue-300 rounded-lg h-16 flex items-center justify-center">
            <span className="text-xs text-blue-400">Drop here</span>
          </div>
        )}
      </div>

      {/* Add issue */}
      <button
        onClick={() => onAddIssue(status.id)}
        className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors rounded-b-xl border-t border-gray-200"
      >
        <Plus className="w-3.5 h-3.5" /> Add issue
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

// ── Main component ────────────────────────────────────────────────

const ProjectDetailsBoard = ({ project }: { project: Project }) => {
  const sortedStatuses = [...project.statuses].sort((a, b) => a.position - b.position);
  const defaultStatus = sortedStatuses.find((s) => s.isDefault) ?? sortedStatuses[0];

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [draggingIssue, setDraggingIssue] = useState<Issue | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatusId, setCreateStatusId] = useState(defaultStatus?.id ?? "");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // ✅ Fix 1: fetch real issues from API on mount
  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(
        `/api/issues/list?projectId=${project.id}`,
        { headers: authHeaders() }
      );
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data?.error?.message ?? "Failed to load issues.");
        return;
      }
      setIssues(data.data ?? []);
    } catch {
      setFetchError("Network error. Could not load issues.");
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  // ✅ Fix 3: drag-drop calls API
  const handleDrop = async (_e: React.DragEvent, statusId: string) => {
    if (!draggingIssue || draggingIssue.statusId === statusId) return;

    // Optimistic update first — board feels instant
    setIssues((prev) =>
      prev.map((i) => i.id === draggingIssue.id ? { ...i, statusId } : i)
    );

    const previousStatusId = draggingIssue.statusId;
    setDraggingIssue(null);

    try {
      const res = await fetch("/api/issues/move", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ issueId: draggingIssue.id, statusId }),
      });
      if (!res.ok) {
        // Rollback on failure
        setIssues((prev) =>
          prev.map((i) =>
            i.id === draggingIssue.id ? { ...i, statusId: previousStatusId } : i
          )
        );
      }
    } catch {
      // Rollback on network error
      setIssues((prev) =>
        prev.map((i) =>
          i.id === draggingIssue.id ? { ...i, statusId: previousStatusId } : i
        )
      );
    }
  };

  // ✅ Fix 4: issue created via API — append real issue from API response
  const handleCreated = (issue: Issue) => {
    setIssues((prev) => [...prev, issue]);
  };

  // ✅ Fix 5: delete calls API (soft delete)
  const handleDelete = async (id: string) => {
    // Optimistic remove
    setIssues((prev) => prev.filter((i) => i.id !== id));

    try {
      const res = await fetch("/api/issues/delete", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ issueId: id }),
      });
      if (!res.ok) {
        // Rollback — re-fetch to restore
        fetchIssues();
      }
    } catch {
      fetchIssues();
    }
  };

  const handleDragStart = (_e: React.DragEvent, issue: Issue) => {
    setDraggingIssue(issue);
  };

  const handleAddIssue = (statusId: string) => {
    setCreateStatusId(statusId);
    setCreateOpen(true);
  };

  // Progress calculation
  const totalIssues = issues.length;
  const doneCount = issues.filter(
    (i) => sortedStatuses.find((s) => s.id === i.statusId)?.category === "DONE"
  ).length;
  const progress = totalIssues > 0 ? Math.round((doneCount / totalIssues) * 100) : 0;

  // Group issues by statusId
  const issuesByStatus = sortedStatuses.reduce<Record<string, Issue[]>>((acc, s) => {
    acc[s.id] = issues.filter((i) => i.statusId === s.id);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full bg-white">

      {/* ── Header ── */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
          <span>Projects</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-600 font-medium">{project.name}</span>
          <ChevronRight className="w-3 h-3" />
          <span>Board</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
              <Badge variant="secondary" className="font-mono text-xs px-2 py-0.5">
                {project.key}
              </Badge>
            </div>
            {project.description && (
              <p className="text-sm text-gray-500">{project.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex -space-x-1.5">
              {project.members.map((m) => (
                <Avatar key={m.userId} className="w-7 h-7 border-2 border-white">
                  {m.user.avatarUrl && <AvatarImage src={m.user.avatarUrl} />}
                  <AvatarFallback className={`text-[10px] font-medium ${getAvatarColor(m.user.name)}`}>
                    {getInitials(m.user.name)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Users className="w-3.5 h-3.5" /> Members
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Settings className="w-3.5 h-3.5" /> Settings
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => { setCreateStatusId(defaultStatus?.id ?? ""); setCreateOpen(true); }}
            >
              <Plus className="w-3.5 h-3.5" /> Create issue
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-xs">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-400">{doneCount} / {totalIssues} done</span>
        </div>
      </div>

      {/* ── Board ── */}
      <div className="flex-1 overflow-auto p-5">

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center h-48 gap-2 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading issues…
          </div>
        )}

        {/* Error state */}
        {!loading && fetchError && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-sm text-red-500">{fetchError}</p>
            <Button variant="outline" size="sm" onClick={fetchIssues}>Retry</Button>
          </div>
        )}

        {/* Board columns */}
        {!loading && !fetchError && (
          <div
            className="grid gap-3 h-full"
            style={{ gridTemplateColumns: `repeat(${sortedStatuses.length}, minmax(220px, 1fr))` }}
          >
            {sortedStatuses.map((status) => (
              <BoardColumn
                key={status.id}
                status={status}
                issues={issuesByStatus[status.id] ?? []}
                members={project.members}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                onAddIssue={handleAddIssue}
                onDeleteIssue={handleDelete}
                onViewClick={(issue) => setSelectedIssue(issue)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Create issue dialog ── */}
      <CreateIssueDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        statuses={sortedStatuses}
        members={project.members}
        defaultStatusId={createStatusId}
        projectId={project.id}
        onCreated={handleCreated}
      />
      {selectedIssue ? <TicketDetailDialog open={selectedIssue ? true : false} projectDetails={project} issue={selectedIssue} onClose={() => setSelectedIssue(null)} /> : <></>}
    </div>
  );
};

export default ProjectDetailsBoard;