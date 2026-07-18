// constants.tsx
import React from "react";
import {
  Plus,
  MoreHorizontal,
  Bug,
  BookOpen,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Settings,
  Users,
  ChevronRight,
  Loader2,
  CheckCircle,
  CheckCircle2,
  LayersMinus,
  Zap,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

// ── Types ─────────────────────────────────────────────────────────

export type IssueType = "TASK" | "BUG" | "STORY" | "EPIC";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type IssueStatus = {
  id: string;
  name: string;
  color: string;
  category: "TODO" | "IN_PROGRESS" | "DONE";
};

export type IssueUser = {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
};

export type Attachment = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  createdAt: string;
  uploader: IssueUser;
};

export type ActivityItem = {
  id: string;
  kind: "comment" | "status_change" | "assignment" | "created" | "field_change";
  actor: IssueUser;
  createdAt: string;
  comment?: string;
  from?: string;
  to?: string;
  field?: string;
};

export type LinkedIssue = {
  id: string;
  key: string;
  title: string;
  type: IssueType;
  priority: Priority;
  relationship: "blocks" | "blocked_by" | "relates_to" | "duplicates";
  status: IssueStatus;
};

export type IssueDetail = {
  id: string;
  key: string;
  title: string;
  description?: string | null;
  type: IssueType;
  priority: Priority;
  status: IssueStatus;
  assignee?: IssueUser | null;
  reporter: IssueUser;
  storyPoints?: number | null;
  dueDate?: string | null;
  position: number;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  project?: { id: string; name: string; key: string };
  attachments?: Attachment[];
  activity?: ActivityItem[];
  linkedIssues?: LinkedIssue[];
  labels?: string[];
};

// ── Configurations ─────────────────────────────────────────────

// Priority Configuration (from your existing file)
export const priorityConfig: Record<Priority, { label: string; icon: React.ReactNode; color: string }> = {
  LOW: { label: "Low", icon: <ArrowDown className="w-3 h-3" />, color: "text-blue-500" },
  MEDIUM: { label: "Medium", icon: <Minus className="w-3 h-3" />, color: "text-gray-400" },
  HIGH: { label: "High", icon: <ArrowUp className="w-3 h-3" />, color: "text-orange-500" },
  URGENT: { label: "Urgent", icon: <AlertCircle className="w-3 h-3" />, color: "text-red-500" },
};

// Type Configuration (from your existing file)
export const typeConfig: Record<IssueType, { label: string; icon: React.ReactNode; color: string }> = {
  TASK: { label: "Task", icon: <CheckCircle className="w-3 h-3" />, color: "text-blue-500" },
  BUG: { label: "Bug", icon: <Bug className="w-3 h-3" />, color: "text-red-500" },
  STORY: { label: "Story", icon: <BookOpen className="w-3 h-3" />, color: "text-purple-500" },
  EPIC: { label: "Epic", icon: <BookOpen className="w-3 h-3" />, color: "text-pink-500" },
};

// Status Dot Color (from your existing file)
export const statusDotColor: Record<string, string> = {
  "#E2E8F0": "#94a3b8",
  "#DBEAFE": "#3b82f6",
  "#FEF3C7": "#f59e0b",
  "#DCFCE7": "#22c55e",
};

// ── Additional Configurations (from TicketDetailPage) ──────────

// TYPE_CONFIG (for TicketDetailPage - with different styling)
export const TYPE_CONFIG: Record<IssueType, { label: string; icon: React.ReactNode; color: string }> = {
  TASK: { label: "Task", icon: <CheckCircle2 size={14} />, color: "#1976D2" },
  BUG: { label: "Bug", icon: <Bug size={14} />, color: "#D32F2F" },
  STORY: { label: "Story", icon: <BookOpen size={14} />, color: "#7B1FA2" },
  EPIC: { label: "Epic", icon: <LayersMinus size={14} />, color: "#C2185B" },
};

// PRIORITY_CONFIG (for TicketDetailPage - with different styling)
export const PRIORITY_CONFIG: any = {
  LOW: { label: "Low", icon: <ArrowDown size={14} />, color: "#1976D2" },
  MEDIUM: { label: "Medium", icon: <Minus size={14} />, color: "#6B7280" },
  HIGH: { label: "High", icon: <ArrowUp size={14} />, color: "#ED6C02" },
  URGENT: { label: "Urgent", icon: <AlertCircle size={14} />, color: "#D32F2F" },
};

// STATUS_CATEGORY_COLOR
export const STATUS_CATEGORY_COLOR: Record<string, string> = {
  TODO: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
};

// RELATIONSHIP_CONFIG
export const RELATIONSHIP_CONFIG = {
  blocks: { label: "Blocks", color: "#D32F2F" },
  blocked_by: { label: "Blocked by", color: "#ED6C02" },
  relates_to: { label: "Relates to", color: "#1976D2" },
  duplicates: { label: "Duplicates", color: "#6B7280" },
};

// LABEL_COLORS
export const LABEL_COLORS: Record<string, { bg: string; text: string }> = {
  frontend: { bg: "#DBEAFE", text: "#1E40AF" },
  backend: { bg: "#D1FAE5", text: "#065F46" },
  auth: { bg: "#FED7AA", text: "#9A3412" },
  bug: { bg: "#FEE2E2", text: "#991B1B" },
  critical: { bg: "#FECACA", text: "#7F1D1D" },
  ui: { bg: "#F3E8FF", text: "#5B21B6" },
  default: { bg: "#F3F4F6", text: "#374151" },
};

// ── Helper Functions ────────────────────────────────────────────

export function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "";
}

export function authHeaders(ct = true): HeadersInit {
  const h: HeadersInit = { Authorization: `Bearer ${getToken()}` };
  if (ct) h["Content-Type"] = "application/json";
  return h;
}

export function getInitials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getAvatarColor(name: string | null) {
  const colors = [
    "#90CAF9",
    "#A5D6A7",
    "#CE93D8",
    "#FFAB91",
    "#F48FB1",
  ];
  return !name ? colors[0] : colors[name.charCodeAt(0) % colors.length];
}

export function formatBytes(b: number) {
  return b < 1024 * 1024
    ? `${(b / 1024).toFixed(0)} KB`
    : `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function relativeTime(date: string) {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return date;
  }
}

export function fullDate(date: string) {
  try {
    return format(new Date(date), "MMM d, yyyy");
  } catch {
    return date;
  }
}

// ── Export common icons for reuse ──────────────────────────────

export const Icons = {
  Plus,
  MoreHorizontal,
  Bug,
  BookOpen,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Settings,
  Users,
  ChevronRight,
  Loader2,
  CheckCircle,
  CheckCircle2,
  LayersMinus,
  Zap,
};

// constants.tsx (add these types)
export type Profile = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

// Add to existing types or create new section
export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};