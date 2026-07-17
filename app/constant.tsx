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
} from "lucide-react";
import { Priority, IssueType } from "./type";

 export const priorityConfig: Record<Priority, { label: string; icon: React.ReactNode; color: string }> = {
  LOW: { label: "Low", icon: <ArrowDown className="w-3 h-3" />, color: "text-blue-500" },
  MEDIUM: { label: "Medium", icon: <Minus className="w-3 h-3" />, color: "text-gray-400" },
  HIGH: { label: "High", icon: <ArrowUp className="w-3 h-3" />, color: "text-orange-500" },
  URGENT: { label: "Urgent", icon: <AlertCircle className="w-3 h-3" />, color: "text-red-500" },
};

 export const typeConfig: Record<IssueType, { label: string; icon: React.ReactNode; color: string }> = {
  TASK: { label: "Task", icon: <CheckCircle className="w-3 h-3" />, color: "text-blue-500" },
  BUG: { label: "Bug", icon: <Bug className="w-3 h-3" />, color: "text-red-500" },
  STORY: { label: "Story", icon: <BookOpen className="w-3 h-3" />, color: "text-purple-500" },
  EPIC: { label: "Epic", icon: <BookOpen className="w-3 h-3" />, color: "text-pink-500" },
};

// Dot color derived from status hex color
 export const statusDotColor: Record<string, string> = {
  "#E2E8F0": "#94a3b8",
  "#DBEAFE": "#3b82f6",
  "#FEF3C7": "#f59e0b",
  "#DCFCE7": "#22c55e",
};
