import prisma from "../config/prisma.js";
import { Priority, IssueType } from "../app/generated/prisma/enums.js";

const ensureProjectMember = async (
  projectId: string,
  userId: string
) => {
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  if (!member) {
    throw Object.assign(
      new Error("You are not a member of this project."),
      { statusCode: 403 }
    );
  }

  return member;
};

export const createIssue = async (
  userId: string,
  body: any
) => {
  const {
    projectId,
    title,
    description,
    statusId,
    assigneeId,
    priority,
    type,
    dueDate,
    storyPoints,
    epicId,
  } = body;

  // =============================
  // Validation
  // =============================

  if (!projectId) {
    throw Object.assign(
      new Error("Project is required."),
      { statusCode: 400 }
    );
  }

  if (!title) {
    throw Object.assign(
      new Error("Title is required."),
      { statusCode: 400 }
    );
  }

  if (!statusId) {
    throw Object.assign(
      new Error("Status is required."),
      { statusCode: 400 }
    );
  }

  // =============================
  // Project
  // =============================

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    throw Object.assign(
      new Error("Project not found."),
      { statusCode: 404 }
    );
  }

  // =============================
  // Permission
  // =============================

  await ensureProjectMember(projectId, userId);

  // =============================
  // Status Validation
  // =============================

  const status = await prisma.status.findFirst({
    where: {
      id: statusId,
      projectId,
    },
  });

  if (!status) {
    throw Object.assign(
      new Error("Invalid status."),
      { statusCode: 400 }
    );
  }

  // =============================
  // Assignee Validation
  // =============================

  if (assigneeId) {
    const assignee = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: assigneeId,
        },
      },
    });

    if (!assignee) {
      throw Object.assign(
        new Error(
          "Assignee is not a member of this project."
        ),
        { statusCode: 400 }
      );
    }
  }

  // =============================
  // Epic Validation
  // =============================

  if (epicId) {
    const epic = await prisma.epic.findFirst({
      where: {
        id: epicId,
        projectId,
      },
    });

    if (!epic) {
      throw Object.assign(
        new Error("Invalid Epic."),
        { statusCode: 400 }
      );
    }
  }

  // =============================
  // Generate Issue Key
  // =============================

  const issueCount = await prisma.issue.count({
    where: {
      projectId,
    },
  });

  const issueKey = `${project.key}-${issueCount + 1}`;

  // =============================
  // Create Issue
  // =============================

  const issue = await prisma.issue.create({
    data: {
      key: issueKey,

      title,

      description,

      priority: priority ?? Priority.MEDIUM,

      type: type ?? IssueType.TASK,

      dueDate: dueDate
        ? new Date(dueDate)
        : undefined,

      storyPoints,

      epicId,

      projectId,

      reporterId: userId,

      assigneeId,

      statusId,
    },

    include: {
      project: {
        select: {
          id: true,
          name: true,
          key: true,
        },
      },

      status: true,

      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },

      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },

      epic: true,
    },
  });

  // =============================
  // Activity Log
  // =============================

  await prisma.activity.create({
    data: {
      action: "Created Issue",
      issueId: issue.id,
      userId,
    },
  });

  return issue;
};

export const getIssueById = async (
  userId: string,
  issueId: string
) => {
  const issue = await prisma.issue.findUnique({
    where: {
      id: issueId,
    },

    include: {
      project: true,

      status: true,

      epic: true,

      reporter: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },

      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },

      comments: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },

      attachments: true,

      activities: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },

      worklogs: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },

      checklist: {
        orderBy: {
          position: "asc",
        },
      },

      issueLabels: {
        include: {
          label: true,
        },
      },

      issueWatchers: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  if (!issue) {
    throw Object.assign(
      new Error("Issue not found."),
      {
        statusCode: 404,
      }
    );
  }

  await ensureProjectMember(
    issue.projectId,
    userId
  );

  return issue;
};