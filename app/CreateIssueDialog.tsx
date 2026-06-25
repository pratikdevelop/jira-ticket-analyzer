"use client";

import {
  Bug,
  BookOpen,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Minus,
  LayersMinus ,
} from "lucide-react";


import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  
  AlertCircle, Upload, X, Plus, Loader2,
  Bold, Italic, List, Code, Link,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────

type IssueType = "TASK" | "BUG" | "STORY" | "EPIC";
type Priority  = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

type AttachmentFile = { id: string; file: File; preview: string | null; type: "image" | "file" };

export type CreatedIssue = {
  id: string; key: string; title: string; description?: string | null;
  type: IssueType; priority: Priority; statusId: string;
  assigneeId?: string | null; position: number;
  assignee?: { id: string; name: string | null; email: string; avatarUrl: string | null } | null;
  reporter?: { id: string; name: string | null; email: string; avatarUrl: string | null } | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectKey: string;
  statuses: Status[];
  members: Member[];
  defaultStatusId?: string;
  onCreated: (issue: CreatedIssue) => void;
};

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


// ── Create issue dialog ───────────────────────────────────────────


// ── Helpers ───────────────────────────────────────────────────────

// ── Issue type config ─────────────────────────────────────────────

const TYPE_CONFIG: Record<IssueType, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  TASK:  { label: "Task",  icon: <CheckCircle2 className="w-4 h-4" />, color: "text-blue-600",   bg: "bg-blue-50 border-blue-200"   },
  BUG:   { label: "Bug",   icon: <Bug          className="w-4 h-4" />, color: "text-red-600",    bg: "bg-red-50 border-red-200"     },
  STORY: { label: "Story", icon: <BookOpen     className="w-4 h-4" />, color: "text-purple-600", bg: "bg-purple-50 border-purple-200"},
  EPIC:  { label: "Epic",  icon: <LayersMinus    />, color: "text-pink-600",   bg: "bg-pink-50 border-pink-200"   },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; icon: React.ReactNode; color: string; bg: string; activeClass: string }> = {
  LOW:    { label: "Low",    icon: <ArrowDown  className="w-3 h-3" />, color: "text-blue-600",   bg: "bg-blue-50",   activeClass: "border-blue-400 bg-blue-50 text-blue-700"    },
  MEDIUM: { label: "Med",    icon: <Minus      className="w-3 h-3" />, color: "text-gray-500",   bg: "bg-gray-50",   activeClass: "border-gray-400 bg-gray-100 text-gray-700"   },
  HIGH:   { label: "High",   icon: <ArrowUp    className="w-3 h-3" />, color: "text-orange-600", bg: "bg-orange-50", activeClass: "border-orange-400 bg-orange-50 text-orange-700"},
  URGENT: { label: "Urgent", icon: <AlertCircle className="w-3 h-3"/>, color: "text-red-600",    bg: "bg-red-50",    activeClass: "border-red-400 bg-red-50 text-red-700"       },
};

const LABEL_OPTIONS = [
  { label: "frontend",  bg: "bg-blue-100",   text: "text-blue-800"   },
  { label: "backend",   bg: "bg-green-100",  text: "text-green-800"  },
  { label: "auth",      bg: "bg-orange-100", text: "text-orange-800" },
  { label: "bug",       bg: "bg-red-100",    text: "text-red-800"    },
  { label: "critical",  bg: "bg-red-200",    text: "text-red-900"    },
  { label: "ui",        bg: "bg-purple-100", text: "text-purple-800" },
  { label: "phase-1",   bg: "bg-teal-100",   text: "text-teal-800"   },
];



function getToken() { return typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : ""; }
function authHeaders(): HeadersInit { return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` }; }
function getInitials(name: string | null) { if (!name) return "?"; return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2); }
function getAvatarColor(name: string | null) {
  const c = ["bg-blue-100 text-blue-700","bg-green-100 text-green-700","bg-purple-100 text-purple-700","bg-orange-100 text-orange-700","bg-pink-100 text-pink-700"];
  return !name ? c[0] : c[name.charCodeAt(0) % c.length];
}
export default function CreateIssueDialog({
  open, onClose, projectId, projectKey, statuses, members, defaultStatusId, onCreated,
}: any) {
  const defaultStatus = defaultStatusId ?? statuses.find((s: any) => s.isDefault)?.id ?? statuses[0]?.id ?? "";

  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [type,        setType]        = useState<IssueType>("TASK");
  const [priority,    setPriority]    = useState<Priority>("MEDIUM");
  const [statusId,    setStatusId]    = useState(defaultStatus);
  const [assigneeId,  setAssigneeId]  = useState<string>("");
  const [storyPoints, setStoryPoints] = useState<string>("");
  const [dueDate,     setDueDate]     = useState<string>("");
  const [labels,      setLabels]      = useState<string[]>([]);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [isDragOver,  setIsDragOver]  = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [createAnother, setCreateAnother] = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form
  const resetForm = useCallback(() => {
    setTitle(""); setDescription(""); setType("TASK"); setPriority("MEDIUM");
    setStatusId(defaultStatus); setAssigneeId(""); setStoryPoints("");
    setDueDate(""); setLabels([]); setAttachments([]); setError(null);
  }, [defaultStatus]);

  // File handling
  const processFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const isImage = file.type.startsWith("image/");
      const id = `${Date.now()}-${Math.random()}`;
      if (isImage) {
        const reader = new FileReader();
        reader.onload = e => setAttachments(prev => [...prev, { id, file, preview: e.target?.result as string, type: "image" }]);
        reader.readAsDataURL(file);
      } else {
        setAttachments(prev => [...prev, { id, file, preview: null, type: "file" }]);
      }
    });
  };

  const removeAttachment = (id: string) => setAttachments(prev => prev.filter(a => a.id !== id));
  const toggleLabel = (label: string) => setLabels(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);

  // Format file size
  const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

  // Submit
  const handleCreate = async () => {
    if (!title.trim() || title.trim().length < 2) { setError("Title must be at least 2 characters."); return; }
    setLoading(true); setError(null);

    try {
      const res = await fetch("/api/issues/create", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          projectId,
          title: title.trim(),
          description: description || null,
          type, priority, statusId,
          assigneeId: assigneeId || null,
          storyPoints: storyPoints ? parseInt(storyPoints) : null,
          dueDate: dueDate || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message ?? "Failed to create issue."); return; }

      onCreated(data.data);
      if (createAnother) { resetForm(); } else { resetForm(); onClose(); }
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const assignee = members.find((m: any) => m.userId === assigneeId);

  return (
    <Dialog open={open}  onOpenChange={(v) => { if (!v) { resetForm(); onClose(); } }} style={{ zIndex: 9999, width: "100%" }}>
      <DialogContent   className="!max-w-[1000px] w-[1000px] p-0 gap-0 overflow-hidden"
 style={{ maxHeight: "90vh" , width: "60vw" }}>

        {/* Header */}
        <DialogHeader className="flex-row items-center justify-between px-5 py-3 border-b space-y-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{projectKey}</span>
            <span className="text-muted-foreground text-xs">·</span>
            <DialogTitle className="text-sm font-medium">Create issue</DialogTitle>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="grid grid-cols-[1fr_260px] min-h-[500px] max-h-[70vh] overflow-auto">

          {/* ── Left: main fields ── */}
          <div className="flex flex-col gap-4 p-5 border-r overflow-y-auto">

            {/* Error */}
            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
              </div>
            )}

            {/* Issue type */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Issue type</Label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(TYPE_CONFIG) as IssueType[]).map(t => {
                  const cfg = TYPE_CONFIG[t];
                  const active = type === t;
                  return (
                    <button key={t} onClick={() => setType(t)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-lg border text-xs font-medium transition-all",
                        active ? cn(cfg.bg, cfg.color, "border-current") : "border-border text-muted-foreground hover:bg-muted"
                      )}>
                      <span className={active ? cfg.color : "text-muted-foreground"}>{cfg.icon}</span>
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Title <span className="text-red-400">*</span>
              </Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Short summary of the issue…"
                className="text-base font-medium border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-blue-400"
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleCreate(); }}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Description</Label>
                {/* Toolbar */}
                <div className="flex gap-0.5">
                  {[
                    { icon: <Bold className="w-3 h-3" />,   title: "Bold"   },
                    { icon: <Italic className="w-3 h-3" />, title: "Italic" },
                    { icon: <List className="w-3 h-3" />,   title: "List"   },
                    { icon: <Code className="w-3 h-3" />,   title: "Code"   },
                    { icon: <Link className="w-3 h-3" />,   title: "Link"   },
                  ].map(({ icon, title }) => (
                    <button key={title} title={title}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground transition-colors">
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the issue in detail. Use @mention to notify teammates…"
                className="min-h-[120px] text-sm resize-none"
              />
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Attachments</Label>

              {/* Thumbnails */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map(att => (
                    <div key={att.id} className="relative group w-16 h-16 rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
                      {att.type === "image" && att.preview ? (
                        <img src={att.preview} alt={att.file.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-0.5 px-1">
                          <Upload className="w-5 h-5 text-muted-foreground" />
                          <span className="text-[9px] text-muted-foreground text-center truncate w-full">
                            {att.file.name.split(".").pop()?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => removeAttachment(att.id)}
                        className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 bg-black/60 rounded-full p-0.5 transition-opacity">
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-[9px] text-white px-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatSize(att.file.size)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={e => { e.preventDefault(); setIsDragOver(false); processFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
                  isDragOver ? "border-blue-400 bg-blue-50" : "border-border hover:border-muted-foreground/40 hover:bg-muted/50"
                )}>
                <Upload className="w-4 h-4 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-xs text-muted-foreground">Drop files here or <span className="text-blue-600 font-medium">browse</span></p>
                <p className="text-[11px] text-muted-foreground mt-0.5">PNG, JPG, PDF, ZIP up to 25 MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept="image/*,.pdf,.zip,.txt,.csv,.doc,.docx"
                onChange={e => processFiles(e.target.files)}
              />
            </div>

            {/* Labels */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Labels</Label>
              <div className="flex flex-wrap gap-1.5">
                {LABEL_OPTIONS.map(({ label, bg, text }) => {
                  const active = labels.includes(label);
                  return (
                    <button key={label} onClick={() => toggleLabel(label)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                        active ? cn(bg, text, "border-current") : "border-border text-muted-foreground hover:bg-muted"
                      )}>
                      {active && <X className="w-2.5 h-2.5" />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ── Right: metadata ── */}
          <div className="flex flex-col gap-5 p-4 bg-muted/30 overflow-y-auto">

            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Priority</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => {
                  const cfg = PRIORITY_CONFIG[p];
                  const active = priority === p;
                  return (
                    <button key={p} onClick={() => setPriority(p)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-1.5 rounded-md border text-xs font-medium transition-all",
                        active ? cfg.activeClass : "border-border text-muted-foreground hover:bg-muted"
                      )}>
                      {cfg.icon} {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={statusId} onValueChange={setStatusId}>
                <SelectTrigger className="h-9 text-sm bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s: any) => (
                    <SelectItem key={s.id} value={s.id} className="text-sm">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="h-9 text-sm bg-background">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" className="text-sm">Unassigned</SelectItem>
                  {members.map((m: any) => (
                    <SelectItem key={m.userId} value={m.userId} className="text-sm">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          {m.user.avatarUrl && <AvatarImage src={m.user.avatarUrl} />}
                          <AvatarFallback className={cn("text-[9px]", getAvatarColor(m.user.name))}>
                            {getInitials(m.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        {m.user.name ?? m.user.email}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {assignee && (
                <div className="flex items-center gap-2 mt-1 px-1">
                  <Avatar className="w-6 h-6">
                    {assignee.user.avatarUrl && <AvatarImage src={assignee.user.avatarUrl} />}
                    <AvatarFallback className={cn("text-[10px]", getAvatarColor(assignee.user.name))}>
                      {getInitials(assignee.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">{assignee.user.name ?? assignee.user.email}</span>
                </div>
              )}
            </div>

            {/* Story points */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Story points</Label>
              <Input
                value={storyPoints}
                onChange={e => setStoryPoints(e.target.value.replace(/\D/, ""))}
                placeholder="0"
                className="h-9 text-sm bg-background"
              />
              {/* Quick pick */}
              <div className="flex gap-1 flex-wrap">
                {["1","2","3","5","8","13"].map((n: string) => (
                  <button key={n} onClick={() => setStoryPoints(n)}
                    className={cn(
                      "px-2 py-0.5 rounded text-xs border transition-colors",
                      storyPoints === n ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"
                    )}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Due date */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Due date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="h-9 text-sm bg-background"
              />
            </div>

            {/* Keyboard shortcut hint */}
            <div className="mt-auto pt-4 border-t">
              <p className="text-[11px] text-muted-foreground text-center">
                Press <kbd className="px-1.5 py-0.5 text-[10px] bg-background border rounded font-mono">⌘ Enter</kbd> to create
              </p>
            </div>

          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex-row items-center justify-between px-5 py-3 border-t bg-muted/30 space-y-0">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={createAnother}
              onChange={e => setCreateAnother(e.target.checked)}
              className="rounded"
            />
            <span className="text-xs text-muted-foreground">Create another</span>
          </label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { resetForm(); onClose(); }} disabled={loading}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={!title.trim() || loading} className="min-w-[110px]">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
              Create issue
            </Button>
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}