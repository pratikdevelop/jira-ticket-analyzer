"use client";

import React, { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    CheckCircle2, Bug, BookOpen, ArrowDown, Minus, ArrowUp,
    AlertCircle, ChevronRight, Paperclip, Smile, MoreHorizontal,
    Link2, Trash2, Edit, ExternalLink, Download, X, Loader2,
    Calendar, Users, Zap, Flag, Clock,
    LayersMinus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { XIcon } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────

type IssueType = "TASK" | "BUG" | "STORY" | "EPIC";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

type IssueStatus = {
    id: string; name: string; color: string;
    category: "TODO" | "IN_PROGRESS" | "DONE";
};

type IssueUser = {
    id: string; name: string | null; email: string; avatarUrl: string | null;
};

type Attachment = {
    id: string; filename: string; mimeType: string;
    sizeBytes: number; url: string; createdAt: string;
    uploader: IssueUser;
};

type ActivityItem = {
    id: string;
    kind: "comment" | "status_change" | "assignment" | "created" | "field_change";
    actor: IssueUser;
    createdAt: string;
    comment?: string;
    from?: string;
    to?: string;
    field?: string;
};

type LinkedIssue = {
    id: string; key: string; title: string;
    type: IssueType; priority: Priority;
    relationship: "blocks" | "blocked_by" | "relates_to" | "duplicates";
    status: IssueStatus;
};

export type IssueDetail = {
    id: string; key: string; title: string;
    description?: string | null;
    type: IssueType; priority: Priority;
    status: IssueStatus;
    assignee?: IssueUser | null;
    reporter: IssueUser;
    storyPoints?: number | null;
    dueDate?: string | null;
    position: number;
    projectId: string;
    createdAt: string; updatedAt: string;
    deletedAt?: string | null;
    project?: { id: string; name: string; key: string };
    attachments?: Attachment[];
    activity?: ActivityItem[];
    linkedIssues?: LinkedIssue[];
    labels?: string[];
};

// ── Helpers ───────────────────────────────────────────────────────

function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : ""; }
function authHeaders(ct = true): HeadersInit {
    const h: HeadersInit = { Authorization: `Bearer ${getToken()}` };
    if (ct) h["Content-Type"] = "application/json";
    return h;
}
function getInitials(name: string | null) { if (!name) return "?"; return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2); }
function getAvatarColor(name: string | null) {
    const c = ["bg-blue-100 text-blue-700", "bg-green-100 text-green-700", "bg-purple-100 text-purple-700", "bg-orange-100 text-orange-700", "bg-pink-100 text-pink-700"];
    return !name ? c[0] : c[name.charCodeAt(0) % c.length];
}
function formatBytes(b: number) { return b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`; }
function relativeTime(date: string) { try { return formatDistanceToNow(new Date(date), { addSuffix: true }); } catch { return date; } }
function fullDate(date: string) { try { return format(new Date(date), "MMM d, yyyy"); } catch { return date; } }

// ── Config ────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<IssueType, { label: string; icon: React.ReactNode; color: string }> = {
    TASK: { label: "Task", icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-blue-600" },
    BUG: { label: "Bug", icon: <Bug className="w-3.5 h-3.5" />, color: "text-red-600" },
    STORY: { label: "Story", icon: <BookOpen className="w-3.5 h-3.5" />, color: "text-purple-600" },
    EPIC: { label: "Epic", icon: <LayersMinus />, color: "text-pink-600" },
};

const PRIORITY_CONFIG: any = {
    LOW: { label: "Low", icon: <ArrowDown className="w-3.5 h-3.5" />, color: "text-blue-600" },
    MEDIUM: { label: "Medium", icon: <Minus className="w-3.5 h-3.5" />, color: "text-gray-500" },
    HIGH: { label: "High", icon: <ArrowUp className="w-3.5 h-3.5" />, color: "text-orange-600" },
    URGENT: { label: "Urgent", icon: <AlertCircle className="w-3.5 h-3.5" />, color: "text-red-600" },
};

const STATUS_CATEGORY_COLOR: Record<string, string> = {
    TODO: "bg-gray-100 text-gray-700 border-gray-200",
    IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
    DONE: "bg-green-100 text-green-700 border-green-200",
};

const RELATIONSHIP_CONFIG = {
    blocks: { label: "Blocks", color: "text-red-600" },
    blocked_by: { label: "Blocked by", color: "text-orange-600" },
    relates_to: { label: "Relates to", color: "text-blue-600" },
    duplicates: { label: "Duplicates", color: "text-gray-500" },
};

const LABEL_COLORS: Record<string, { bg: string; text: string }> = {
    frontend: { bg: "bg-blue-100", text: "text-blue-800" },
    backend: { bg: "bg-green-100", text: "text-green-800" },
    auth: { bg: "bg-orange-100", text: "text-orange-800" },
    bug: { bg: "bg-red-100", text: "text-red-800" },
    critical: { bg: "bg-red-200", text: "text-red-900" },
    ui: { bg: "bg-purple-100", text: "text-purple-800" },
    default: { bg: "bg-gray-100", text: "text-gray-700" },
};

// ── Subcomponents ─────────────────────────────────────────────────

function SideField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
            <div className="text-sm">{children}</div>
        </div>
    );
}

function ActivityEntry({ item }: { item: ActivityItem }) {
    const typeIcon: Record<ActivityItem["kind"], React.ReactNode> = {
        comment: <Smile className="w-3 h-3" />,
        status_change: <Zap className="w-3 h-3" />,
        assignment: <Users className="w-3 h-3" />,
        created: <CheckCircle2 className="w-3 h-3" />,
        field_change: <Edit className="w-3 h-3" />,
    };

    return (
        <div className="flex gap-3 py-3 border-b last:border-0">
            <Avatar className="w-7 h-7 flex-shrink-0 mt-0.5">
                {item.actor.avatarUrl && <AvatarImage src={item.actor.avatarUrl} />}
                <AvatarFallback className={cn("text-[10px]", getAvatarColor(item.actor.name))}>
                    {getInitials(item.actor.name)}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium">{item.actor.name ?? item.actor.email}</span>
                    <span className="text-[11px] text-muted-foreground">{relativeTime(item.createdAt)}</span>
                </div>
                {item.kind === "comment" && item.comment && (
                    <div className="bg-muted rounded-lg px-3 py-2 text-sm text-foreground leading-relaxed mt-1">
                        {item.comment}
                    </div>
                )}
                {item.kind === "status_change" && (
                    <p className="text-xs text-muted-foreground">
                        Changed status from <span className="font-medium text-foreground">{item.from}</span>
                        {" → "}
                        <span className="font-medium text-foreground">{item.to}</span>
                    </p>
                )}
                {item.kind === "assignment" && (
                    <p className="text-xs text-muted-foreground">
                        {item.to ? <>Assigned to <span className="font-medium text-foreground">{item.to}</span></> : "Removed assignee"}
                    </p>
                )}
                {item.kind === "created" && (
                    <p className="text-xs text-muted-foreground">Created this issue</p>
                )}
                {item.kind === "field_change" && (
                    <p className="text-xs text-muted-foreground">
                        Changed <span className="font-medium text-foreground">{item.field}</span> from{" "}
                        <span className="font-medium text-foreground">{item.from}</span> →{" "}
                        <span className="font-medium text-foreground">{item.to}</span>
                    </p>
                )}
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────

type Props = {
    initialIssue: IssueDetail;
    projectDetails: any;
    onBack?: () => void;
    onDeleted?: () => void;
    onUpdated?: (issue: IssueDetail) => void;
};

export default function TicketDetailPage({ initialIssue, projectDetails, onBack, onDeleted, onUpdated }: Props) {
    const [issue, setIssue] = useState<IssueDetail>(initialIssue);
    const [project, setProjet] = useState<any>(projectDetails);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedStatus, setSelectedStatus] = useState<any>(issue.status.id);

    useEffect(() => {
        setIssue(initialIssue);
        setProjet(project)


    }, [initialIssue, projectDetails]);

    // ── Inline status change ──────────────────────────────────────
    const handleStatusChange = async (statusId: any) => {
        try {
            const res = await fetch("/api/issues/move", {
                method: "POST", headers: authHeaders(),
                body: JSON.stringify({ issueId: issue.id, statusId }),
            });
            if (res.ok) {
                const data = await res.json();
                setIssue(prev => ({ ...prev, status: data.data.status }));
                onUpdated?.({ ...issue, status: data.data.status });
            }
        } catch { /* silent */ }
    };

    // ── Submit comment ────────────────────────────────────────────
    const handleComment = async () => {
        if (!comment.trim()) return;
        setSubmitting(true);
        try {
            // POST /api/issues/comment — wire up when comments API is built
            // For now: optimistic local append
            const optimistic: ActivityItem = {
                id: `temp-${Date.now()}`,
                kind: "comment",
                actor: issue.reporter,
                createdAt: new Date().toISOString(),
                comment: comment.trim(),
            };
            setIssue(prev => ({
                ...prev,
                activity: [...(prev.activity ?? []), optimistic],
            }));
            setComment("");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Delete issue ──────────────────────────────────────────────
    const handleDelete = async () => {
        if (!confirm("Delete this issue? This cannot be undone.")) return;
        setDeleting(true);
        try {
            const res = await fetch("/api/issues/delete", {
                method: "POST", headers: authHeaders(),
                body: JSON.stringify({ issueId: issue.id }),
            });
            if (res.ok) onDeleted?.();
        } finally {
            setDeleting(false);
        }
    };

    const typeCfg = TYPE_CONFIG[issue.type] ?? TYPE_CONFIG.TASK;
    const priorityCfg = PRIORITY_CONFIG[issue.priority] ?? PRIORITY_CONFIG.MEDIUM;
    const statusClass = STATUS_CATEGORY_COLOR[issue.status.category] ?? "bg-gray-100 text-gray-700";
    const isOverdue = issue.dueDate && new Date(issue.dueDate) < new Date();

    return (
        <div className="flex flex-col h-full bg-background">

            {/* ── Top breadcrumb bar ── */}
            <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/30 flex-shrink-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {onBack && (
                        <>
                            <button onClick={onBack} className="hover:text-foreground transition-colors">Projects</button>
                            <ChevronRight className="w-3 h-3" />
                        </>
                    )}
                    {issue.project && (
                        <>
                            <span className="hover:text-foreground cursor-pointer transition-colors">{issue.project.name}</span>
                            <ChevronRight className="w-3 h-3" />
                            <span className="hover:text-foreground cursor-pointer transition-colors">Board</span>
                            <ChevronRight className="w-3 h-3" />
                        </>
                    )}
                    <span className="font-mono font-medium text-foreground">{issue.key}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                        <ExternalLink className="w-3 h-3" /> Open full page
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                                <MoreHorizontal className="w-3.5 h-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem className="text-xs gap-2"><Edit className="w-3.5 h-3.5" /> Edit issue</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs gap-2"><Link2 className="w-3.5 h-3.5" /> Copy link</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-xs gap-2 text-red-600 focus:text-red-600"
                                onClick={handleDelete}
                                disabled={deleting}>
                                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                Delete issue
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline"  className="h-8 w-8 rounded-full p-1">
                    <XIcon onClick={onBack} />

                    </Button>
                </div>
            </div>

            {/* ── Main layout ── */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── Left: content ── */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">

                    {/* Header */}
                    <div>
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", typeCfg.color)}>
                                {typeCfg.icon} {typeCfg.label}
                            </span>
                            <span className="text-border">·</span>
                            <Select value={issue.status.id} onValueChange={handleStatusChange}>
                                <SelectTrigger
                                    className={cn(
                                        "h-6 text-xs border rounded-full px-2.5 gap-1.5 w-auto",
                                        statusClass
                                    )}
                                >
                                    {issue.status.name}
                                </SelectTrigger>

                                <SelectContent>
                                    {project.statuses?.map((status: any) => (
                                        <SelectItem key={status.id} value={status.id}>
                                            {status.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span className="text-border">·</span>n
                            {/* <span className={cn("inline-flex items-ceter gap-1 text-xs font-medium", priorityCfg.color)}>
                                {priorityCfg.icon} {priorityCfg.label}
                            </span> */}

                            <Select value={issue.priority} onValueChange={handleStatusChange}>
                                <SelectTrigger
                                    className={cn(
                                        "h-6 text-xs border rounded-full px-2.5 gap-1.5 w-auto",
                                        statusClass
                                    )}
                                >
                                    {priorityCfg.icon}  <h4>{priorityCfg.label}</h4>

                                </SelectTrigger>

                                <SelectContent>
                                    {Object.keys(PRIORITY_CONFIG)?.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {PRIORITY_CONFIG[status].icon} {PRIORITY_CONFIG[status].label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                        </div>

                        <h1 className="text-2xl font-semibold leading-tight mb-2">{issue.title}</h1>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Created {fullDate(issue.createdAt)}
                            </span>
                            <span>·</span>
                            <span>Updated {relativeTime(issue.updatedAt)}</span>
                            {issue.storyPoints != null && (
                                <>
                                    <span>·</span>
                                    <span className="flex items-center gap-1">
                                        <Zap className="w-3 h-3" /> {issue.storyPoints} {issue.storyPoints === 1 ? "point" : "points"}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <h2 className="text-sm font-medium mb-2">Description</h2>
                        {issue.description ? (
                            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap prose-sm max-w-none">
                                {issue.description}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground italic">No description provided.</p>
                        )}
                    </div>

                    {/* Labels */}
                    {issue.labels && issue.labels.length > 0 && (
                        <div>
                            <h2 className="text-sm font-medium mb-2">Labels</h2>
                            <div className="flex flex-wrap gap-1.5">
                                {issue.labels.map(label => {
                                    const lc = LABEL_COLORS[label] ?? LABEL_COLORS.default;
                                    return (
                                        <span key={label} className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", lc.bg, lc.text)}>
                                            {label}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Attachments */}
                    {issue.attachments && issue.attachments.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-sm font-medium">Attachments ({issue.attachments.length})</h2>
                                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5"
                                    onClick={() => fileInputRef.current?.click()}>
                                    <Paperclip className="w-3.5 h-3.5" /> Attach file
                                </Button>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                                {issue.attachments.map(att => {
                                    const isImage = att.mimeType.startsWith("image/");
                                    return (
                                        <div key={att.id}
                                            className="group border rounded-lg overflow-hidden cursor-pointer hover:border-muted-foreground/40 transition-colors"
                                            onClick={() => isImage ? setPreviewUrl(att.url) : window.open(att.url)}>
                                            <div className="h-20 bg-muted flex items-center justify-center relative">
                                                {isImage ? (
                                                    <img src={att.url} alt={att.filename} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Paperclip className="w-6 h-6 text-muted-foreground" />
                                                        <span className="text-[9px] text-muted-foreground font-mono uppercase">
                                                            {att.filename.split(".").pop()}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                    <Download className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </div>
                                            <div className="p-1.5 border-t">
                                                <p className="text-[10px] text-muted-foreground truncate">{att.filename}</p>
                                                <p className="text-[9px] text-muted-foreground">{formatBytes(att.sizeBytes)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                {/* Add more */}
                                <div
                                    className="border-2 border-dashed rounded-lg h-[92px] flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-muted-foreground/40 hover:bg-muted/50 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}>
                                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-[10px] text-muted-foreground">Add file</span>
                                </div>
                            </div>
                            <input ref={fileInputRef} type="file" multiple className="hidden" />
                        </div>
                    )}

                    {/* Image preview overlay */}
                    {previewUrl && (
                        <div
                            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-8"
                            onClick={() => setPreviewUrl(null)}>
                            <button className="absolute top-4 right-4 text-white hover:text-gray-300">
                                <X className="w-6 h-6" />
                            </button>
                            <img src={previewUrl} alt="Preview" className="max-w-full max-h-full rounded-lg object-contain" />
                        </div>
                    )}

                    {/* Linked issues */}
                    {issue.linkedIssues && issue.linkedIssues.length > 0 && (
                        <div>
                            <h2 className="text-sm font-medium mb-2">Linked issues</h2>
                            <div className="space-y-2">
                                {issue.linkedIssues.map(linked => {
                                    const rel = RELATIONSHIP_CONFIG[linked.relationship];
                                    const lt = TYPE_CONFIG[linked.type];
                                    return (
                                        <div key={linked.id}
                                            className="flex items-center gap-3 p-3 border rounded-lg hover:border-muted-foreground/40 cursor-pointer transition-colors">
                                            <span className={cn("text-xs font-medium min-w-[70px]", rel.color)}>{rel.label}</span>
                                            <span className={cn("flex-shrink-0", lt.color)}>{lt.icon}</span>
                                            <span className="font-mono text-xs text-muted-foreground flex-shrink-0">{linked.key}</span>
                                            <span className="text-sm text-foreground flex-1 truncate">{linked.title}</span>
                                            <span className={cn("text-xs px-2 py-0.5 rounded-full border",
                                                STATUS_CATEGORY_COLOR[linked.status.category])}>
                                                {linked.status.name}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Activity */}
                    <div>
                        <h2 className="text-sm font-medium mb-3">Activity</h2>

                        {(!issue.activity || issue.activity.length === 0) ? (
                            <p className="text-sm text-muted-foreground italic">No activity yet.</p>
                        ) : (
                            <div>
                                {issue.activity.map(item => <ActivityEntry key={item.id} item={item} />)}
                            </div>
                        )}

                        {/* Comment input */}
                        <div className="flex gap-3 mt-4">
                            <Avatar className="w-7 h-7 flex-shrink-0 mt-1">
                                {issue.reporter.avatarUrl && <AvatarImage src={issue.reporter.avatarUrl} />}
                                <AvatarFallback className={cn("text-[10px]", getAvatarColor(issue.reporter.name))}>
                                    {getInitials(issue.reporter.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                                <Textarea
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    placeholder="Add a comment… Use @name to mention someone"
                                    className="text-sm resize-none min-h-[80px]"
                                    onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleComment(); }}
                                />
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                        <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                        <Smile className="w-3.5 h-3.5 text-muted-foreground" />
                                    </Button>
                                    <Button size="sm" className="h-7 text-xs ml-auto"
                                        onClick={handleComment}
                                        disabled={!comment.trim() || submitting}>
                                        {submitting && <Loader2 className="w-3 h-3 animate-spin mr-1.5" />}
                                        Comment
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* ── Right: sidebar ── */}
                <div className="w-64 flex-shrink-0 border-l bg-muted/20 overflow-y-auto px-4 py-5 space-y-5">

                    <SideField label="Assignee">
                        {issue.assignee ? (
                            <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                    {issue.assignee.avatarUrl && <AvatarImage src={issue.assignee.avatarUrl} />}
                                    <AvatarFallback className={cn("text-[9px]", getAvatarColor(issue.assignee.name))}>
                                        {getInitials(issue.assignee.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <span>{issue.assignee.name ?? issue.assignee.email}</span>
                            </div>
                        ) : (
                            <span className="text-muted-foreground italic">Unassigned</span>
                        )}
                    </SideField>

                    <div className="h-px bg-border" />

                    <SideField label="Reporter">
                        <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                                {issue.reporter.avatarUrl && <AvatarImage src={issue.reporter.avatarUrl} />}
                                <AvatarFallback className={cn("text-[9px]", getAvatarColor(issue.reporter.name))}>
                                    {getInitials(issue.reporter.name)}
                                </AvatarFallback>
                            </Avatar>
                            <span>{issue.reporter.name ?? issue.reporter.email}</span>
                        </div>
                    </SideField>

                    <div className="h-px bg-border" />

                    <SideField label="Priority">
                        <span className={cn("inline-flex items-center gap-1.5 font-medium", priorityCfg.color)}>
                            {priorityCfg.icon} {priorityCfg.label}
                        </span>
                    </SideField>

                    <div className="h-px bg-border" />

                    <SideField label="Story points">
                        {issue.storyPoints != null ? (
                            <span className="flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                                {issue.storyPoints} {issue.storyPoints === 1 ? "point" : "points"}
                            </span>
                        ) : (
                            <span className="text-muted-foreground italic">Not set</span>
                        )}
                    </SideField>

                    <div className="h-px bg-border" />

                    <SideField label="Due date">
                        {issue.dueDate ? (
                            <span className={cn("flex items-center gap-1.5", isOverdue ? "text-red-600 font-medium" : "")}>
                                <Calendar className="w-3.5 h-3.5" />
                                {fullDate(issue.dueDate)}
                                {isOverdue && <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">Overdue</Badge>}
                            </span>
                        ) : (
                            <span className="text-muted-foreground italic">No due date</span>
                        )}
                    </SideField>

                    <div className="h-px bg-border" />

                    <SideField label="Type">
                        <span className={cn("inline-flex items-center gap-1.5", typeCfg.color)}>
                            {typeCfg.icon} {typeCfg.label}
                        </span>
                    </SideField>

                    <div className="h-px bg-border" />

                    <SideField label="Status">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border", statusClass)}>
                            {issue.status.name}
                        </span>
                    </SideField>

                    {issue.project && (
                        <>
                            <div className="h-px bg-border" />
                            <SideField label="Project">
                                <span className="flex items-center gap-1.5">
                                    <Flag className="w-3.5 h-3.5 text-muted-foreground" />
                                    {issue.project.name}
                                    <span className="font-mono text-xs text-muted-foreground">({issue.project.key})</span>
                                </span>
                            </SideField>
                        </>
                    )}

                    {issue.linkedIssues && issue.linkedIssues.length > 0 && (
                        <>
                            <div className="h-px bg-border" />
                            <SideField label="Linked issues">
                                <div className="space-y-1.5">
                                    {issue.linkedIssues.map(linked => {
                                        const rel = RELATIONSHIP_CONFIG[linked.relationship];
                                        const lt = TYPE_CONFIG[linked.type];
                                        return (
                                            <div key={linked.id}
                                                className="flex items-center gap-1.5 p-1.5 rounded-md border hover:border-muted-foreground/40 cursor-pointer transition-colors text-xs">
                                                <span className={cn("flex-shrink-0", lt.color)}>{lt.icon}</span>
                                                <span className="font-mono text-muted-foreground flex-shrink-0">{linked.key}</span>
                                                <span className="truncate flex-1">{linked.title}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </SideField>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}