"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Grid,
  Stack,
  Typography,
  Button,
  Avatar,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Chip,
  IconButton,
  Paper,
  Divider,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloseIcon from "@mui/icons-material/Close";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import CodeIcon from "@mui/icons-material/Code";
import LinkIcon from "@mui/icons-material/Link";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import {
  Bug,
  BookOpen,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Minus,
  LayersMinus,
} from "lucide-react";

type IssueType = "TASK" | "BUG" | "STORY" | "EPIC";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

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

type AttachmentFile = {
  id: string;
  file: File;
  preview: string | null;
  type: "image" | "file";
};

export type CreatedIssue = {
  id: string;
  key: string;
  title: string;
  description?: string | null;
  type: IssueType;
  priority: Priority;
  statusId: string;
  assigneeId?: string | null;
  position: number;
  assignee?: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  } | null;
  reporter?: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  } | null;
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

const TYPE_CONFIG: Record<IssueType, { label: string; icon: React.ReactNode; color: string }> = {
  TASK: {
    label: "Task",
    icon: <CheckCircle2 size={18} />,
    color: "#1976d2",
  },
  BUG: {
    label: "Bug",
    icon: <Bug size={18} />,
    color: "#d32f2f",
  },
  STORY: {
    label: "Story",
    icon: <BookOpen size={18} />,
    color: "#7b1fa2",
  },
  EPIC: {
    label: "Epic",
    icon: <LayersMinus size={18} />,
    color: "#ec407a",
  },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; icon: React.ReactNode }> = {
  LOW: {
    label: "Low",
    icon: <ArrowDown size={15} />,
  },
  MEDIUM: {
    label: "Medium",
    icon: <Minus size={15} />,
  },
  HIGH: {
    label: "High",
    icon: <ArrowUp size={15} />,
  },
  URGENT: {
    label: "Urgent",
    icon: <WarningAmberIcon fontSize="small" />,
  },
};

const LABEL_OPTIONS = [
  "frontend",
  "backend",
  "auth",
  "bug",
  "critical",
  "ui",
  "phase-1",
];

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "";
}

function authHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string | null) {
  const colors = ["#1976d2", "#388e3c", "#7b1fa2", "#ef6c00", "#c2185b"];
  if (!name) return colors[0];
  return colors[name.charCodeAt(0) % colors.length];
}

export default function CreateIssueDialog({
  open,
  onClose,
  projectId,
  projectKey,
  statuses,
  members,
  defaultStatusId,
  onCreated,
}: Props) {
  const defaultStatus = defaultStatusId ?? "";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<IssueType>("TASK");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [statusId, setStatusId] = useState(defaultStatus);
  const [assigneeId, setAssigneeId] = useState("");
  const [storyPoints, setStoryPoints] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [createAnother, setCreateAnother] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setType("TASK");
    setPriority("MEDIUM");
    setStatusId(defaultStatus);
    setAssigneeId("");
    setStoryPoints("");
    setDueDate("");
    setLabels([]);
    setAttachments([]);
    setError(null);
  }, [defaultStatus]);

  const toggleLabel = (label: string) => {
    setLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const processFiles = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      const id = Date.now() + "-" + Math.random();
      const isImage = file.type.startsWith("image/");

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachments((prev) => [
            ...prev,
            {
              id,
              file,
              preview: e.target?.result as string,
              type: "image",
            },
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachments((prev) => [
          ...prev,
          {
            id,
            file,
            preview: null,
            type: "file",
          },
        ]);
      }
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const assignee = members?.find((m) => m.userId === assigneeId);

  const handleCreate = async () => {
    if (!title.trim() || title.trim().length < 2) {
      setError("Title must be at least 2 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/api/issues/create", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          projectId,
          title: title.trim(),
          description: description || null,
          type,
          priority,
          statusId,
          assigneeId: assigneeId || null,
          storyPoints: storyPoints ? parseInt(storyPoints) : null,
          dueDate: dueDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error?.message ?? "Failed to create issue.");
        return;
      }

      onCreated(data.data);

      if (createAnother) {
        resetForm();
      } else {
        resetForm();
        onClose();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        resetForm();
        onClose();
      }}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          py: 2,
          px: 3,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip 
            label={projectKey} 
            size="small" 
            color="primary" 
            variant="outlined" 
          />
          <Typography variant="body2" color="text.secondary">
            Create Issue
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: "hidden" }}>
        <Grid container>
          <Grid 
            size={{ sm: 12, md: 8 }} 
            sx={{ 
              borderRight: { md: "1px solid" }, 
              borderColor: { md: "divider" },
              p: 3,
            }}
          >
            {error && (
              <Paper 
                sx={{ 
                  p: 2, 
                  mb: 3, 
                  bgcolor: "error.light", 
                  border: "1px solid",
                  borderColor: "error.main",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <WarningAmberIcon color="error" fontSize="small" />
                  <Typography color="error" variant="body2">
                    {error}
                  </Typography>
                </Stack>
              </Paper>
            )}

            <Typography variant="subtitle2" gutterBottom>
              Issue Type
            </Typography>

            <Grid container spacing={2} sx={{ mb: 4 }}>
              {(Object.keys(TYPE_CONFIG) as IssueType[]).map((t) => {
                const active = type === t;
                return (
                  <Grid item xs={6} sm={3} key={t}>
                    <Paper
                      onClick={() => setType(t)}
                      sx={{
                        cursor: "pointer",
                        p: 2,
                        textAlign: "center",
                        border: active ? `2px solid ${TYPE_CONFIG[t].color}` : "1px solid",
                        borderColor: active ? TYPE_CONFIG[t].color : "divider",
                        transition: "all 0.2s",
                        "&:hover": {
                          boxShadow: 3,
                        },
                      }}
                    >
                      <Box sx={{ color: TYPE_CONFIG[t].color }}>
                        {TYPE_CONFIG[t].icon}
                      </Box>
                      <Typography mt={1} fontWeight={600}>
                        {TYPE_CONFIG[t].label}
                      </Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>

            <TextField
              fullWidth
              label="Title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mb: 4 }}
            />

            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2">Description</Typography>
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small" sx={{ borderRadius: 1 }}>
                  <FormatBoldIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" sx={{ borderRadius: 1 }}>
                  <FormatItalicIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" sx={{ borderRadius: 1 }}>
                  <FormatListBulletedIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" sx={{ borderRadius: 1 }}>
                  <CodeIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" sx={{ borderRadius: 1 }}>
                  <LinkIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>

            <TextField
              multiline
              rows={8}
              fullWidth
              placeholder="Describe the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{
                "& .MuiInputBase-root": {
                  borderRadius: 2,
                },
              }}
            />

            <Divider sx={{ my: 4 }} />

            <Typography variant="subtitle2" sx={{ mt: 3, mb: 2 }}>
              Attachments
            </Typography>

            <Box
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                processFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: "2px dashed",
                borderColor: isDragOver ? "primary.main" : "grey.400",
                borderRadius: 2,
                p: 4,
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                bgcolor: isDragOver ? "action.hover" : "background.paper",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: "action.hover",
                },
              }}
            >
              <UploadFileIcon color="primary" sx={{ fontSize: 40 }} />
              <Typography mt={2} fontWeight={600}>
                Drag & Drop Files
              </Typography>
              <Typography variant="body2" color="text.secondary">
                or click to browse
              </Typography>
              <Typography variant="caption" color="text.secondary">
                PNG, JPG, PDF, ZIP (25MB)
              </Typography>
            </Box>

            <input
              ref={fileInputRef}
              hidden
              type="file"
              multiple
              accept="image/*,.pdf,.zip,.doc,.docx,.csv,.txt"
              onChange={(e) => processFiles(e.target.files)}
            />

            {attachments.length > 0 && (
              <Box mt={3} sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {attachments.map((att) => (
                  <Paper 
                    key={att.id} 
                    elevation={2} 
                    sx={{ 
                      width: 120, 
                      overflow: "hidden", 
                      position: "relative",
                      borderRadius: 2,
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => removeAttachment(att.id)}
                      sx={{ 
                        position: "absolute", 
                        right: 4, 
                        top: 4, 
                        bgcolor: "background.paper",
                        "&:hover": {
                          bgcolor: "grey.100",
                        },
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                    {att.type === "image" ? (
                      <Box
                        component="img"
                        src={att.preview!}
                        sx={{ 
                          width: "100%", 
                          height: 100, 
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Box 
                        sx={{ 
                          height: 100, 
                          display: "flex", 
                          justifyContent: "center", 
                          alignItems: "center",
                          bgcolor: "grey.50",
                        }}
                      >
                        <UploadFileIcon sx={{ fontSize: 40, color: "grey.400" }} />
                      </Box>
                    )}
                    <Box p={1}>
                      <Typography variant="caption" noWrap display="block">
                        {att.file.name}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {formatSize(att.file.size)}
                      </Typography>
                    </Box>
                  </Paper>
                ))}
              </Box>
            )}

            <Typography variant="subtitle2" sx={{ mt: 4, mb: 2 }}>
              Labels
            </Typography>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {LABEL_OPTIONS.map((label) => (
                <Chip
                  key={label}
                  label={label}
                  clickable
                  color={labels.includes(label) ? "primary" : "default"}
                  onClick={() => toggleLabel(label)}
                  variant={labels.includes(label) ? "filled" : "outlined"}
                />
              ))}
            </Box>
          </Grid>

          <Grid 
            item 
            xs={12} 
            md={4} 
            sx={{ 
              p: 3, 
              bgcolor: "grey.50",
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Priority
            </Typography>

            <Grid container spacing={1} mb={3}>
              {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
                <Grid item xs={6} key={p}>
                  <Paper
                    onClick={() => setPriority(p)}
                    sx={{
                      p: 1.5,
                      cursor: "pointer",
                      textAlign: "center",
                      border: priority === p ? "2px solid" : "1px solid",
                      borderColor: priority === p ? "primary.main" : "divider",
                      transition: "all 0.2s",
                      "&:hover": {
                        boxShadow: 3,
                      },
                    }}
                  >
                    <Stack alignItems="center" spacing={0.5}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        {PRIORITY_CONFIG[p].icon}
                      </Box>
                      <Typography variant="caption" fontWeight={priority === p ? 600 : 400}>
                        {PRIORITY_CONFIG[p].label}
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Status</InputLabel>
              <Select 
                label="Status" 
                value={statusId} 
                onChange={(e) => setStatusId(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                {statuses?.map((status) => (
                  <MenuItem key={status.id} value={status.id}>
                    {status.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Assignee</InputLabel>
              <Select 
                label="Assignee" 
                value={assigneeId} 
                onChange={(e) => setAssigneeId(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">Unassigned</MenuItem>
                {members?.map((member) => (
                  <MenuItem key={member.userId} value={member.userId}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar
                        src={member.user.avatarUrl ?? undefined}
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          bgcolor: getAvatarColor(member.user.name),
                          fontSize: "0.6rem",
                        }}
                      >
                        {getInitials(member.user.name)}
                      </Avatar>
                      <Typography variant="body2">
                        {member.user.name ?? member.user.email}
                      </Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {assignee && (
              <Paper 
                sx={{ 
                  p: 2, 
                  mb: 3, 
                  borderRadius: 2,
                  bgcolor: "background.paper",
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={assignee.user.avatarUrl ?? undefined}
                    sx={{ 
                      bgcolor: getAvatarColor(assignee.user.name),
                      width: 40,
                      height: 40,
                    }}
                  >
                    {getInitials(assignee.user.name)}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={600}>
                      {assignee.user.name ?? assignee.user.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Assignee
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            )}

            <TextField
              label="Story Points"
              fullWidth
              type="number"
              value={storyPoints}
              onChange={(e) => setStoryPoints(e.target.value)}
              sx={{ 
                mb: 2,
                "& .MuiInputBase-root": {
                  borderRadius: 2,
                },
              }}
            />

            <Box mb={3}>
              {[1, 2, 3, 5, 8, 13].map((point) => (
                <Chip
                  key={point}
                  label={point}
                  clickable
                  color={storyPoints === point.toString() ? "primary" : "default"}
                  onClick={() => setStoryPoints(point.toString())}
                  variant={storyPoints === point.toString() ? "filled" : "outlined"}
                  sx={{ mr: 0.5, mb: 0.5 }}
                />
              ))}
            </Box>

            <TextField
              label="Due Date"
              type="date"
              fullWidth
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ 
                mb: 4,
                "& .MuiInputBase-root": {
                  borderRadius: 2,
                },
              }}
            />

            <Paper 
              sx={{ 
                p: 2, 
                bgcolor: "grey.100",
                borderRadius: 2,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Shortcut
              </Typography>
              <Typography mt={1} fontWeight={600}>
                Ctrl + Enter
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create Issue Quickly
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions
        sx={{
          justifyContent: "space-between",
          px: 3,
          py: 2,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <FormControlLabel
          control={
            <Checkbox 
              checked={createAnother} 
              onChange={(e) => setCreateAnother(e.target.checked)} 
            />
          }
          label="Create another"
        />

        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="primary"
            disabled={!title.trim() || loading}
            onClick={handleCreate}
            startIcon={
              loading ? <CircularProgress size={18} color="inherit" /> : <AddIcon />
            }
            sx={{ borderRadius: 2 }}
          >
            {loading ? "Creating..." : "Create Issue"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}