
 export type Status = {
  id: string;
  name: string;
  color: string;
  position: number;
  category: "TODO" | "IN_PROGRESS" | "DONE";
  isDefault: boolean;
  projectId: string;
};

 export type Member = {
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

 export type Project = {
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
 export type IssueType = "TASK" | "BUG" | "STORY" | "EPIC";
 export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

 export type Issue = {
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
