// services/project.service.ts

import prisma from "../config/prisma.js";
import { Role } from "../app/generated/prisma/enums.js"


import { StatusCategory } from "../app/generated/prisma/client.js";
// ======================================================
// Custom Error
// ======================================================

class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

// ======================================================
// Generate Project Key
// ======================================================

async function generateUniqueKey(name: string): Promise<string> {
  const words = name.trim().split(/\s+/);

  let base =
    words.length === 1
      ? name.slice(0, 4).toUpperCase()
      : words.map((w) => w[0]).join("").toUpperCase();

  base = base.replace(/[^A-Z0-9]/g, "").slice(0, 10);

  if (!base) {
    base = "PROJ";
  }

  let key = base;
  let counter = 2;

  while (
    await prisma.project.findUnique({
      where: { key },
    })
  ) {
    key = `${base}${counter}`;
    counter++;
  }

  return key;
}

// ======================================================
// CREATE PROJECT
// ======================================================

export async function createProject(
  userId: string,
  body: any
) {
  let { name, description, key } = body;

  // ---------------- Validation ----------------

  if (!name || typeof name !== "string") {
    throw new ApiError(400, "Project name is required.");
  }

  name = name.trim();

  if (name.length < 2) {
    throw new ApiError(
      400,
      "Project name must be at least 2 characters."
    );
  }

  if (name.length > 100) {
    throw new ApiError(
      400,
      "Project name cannot exceed 100 characters."
    );
  }

  if (description && description.length > 500) {
    throw new ApiError(
      400,
      "Description cannot exceed 500 characters."
    );
  }

  // ---------------- Project Key ----------------

  if (key) {
    key = key
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10);

    const exists = await prisma.project.findUnique({
      where: {
        key,
      },
    });

    if (exists) {
      throw new ApiError(
        409,
        `Project key "${key}" already exists.`
      );
    }
  } else {
    key = await generateUniqueKey(name);
  }

  // ---------------- Transaction ----------------

  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        name,
        description,
        key,
        ownerId: userId,
      },
    });

    // Default Statuses

    await tx.status.createMany({
      data: [
        {
          name: "To Do",
          category: "TODO",
          color: "#E2E8F0",
          position: 1,
          isDefault: true,
          projectId: created.id,
        },
        {
          name: "In Progress",
          category: "IN_PROGRESS",
          color: "#DBEAFE",
          position: 2,
          projectId: created.id,
        },
        {
          name: "In Review",
          category: "IN_PROGRESS",
          color: "#FEF3C7",
          position: 3,
          projectId: created.id,
        },
        {
          name: "Done",
          category: "DONE",
          color: "#DCFCE7",
          position: 4,
          projectId: created.id,
        },
      ],
    });

    // Creator becomes Admin

    await tx.projectMember.create({
      data: {
        projectId: created.id,
        userId,
        role: Role.ADMIN,
      },
    });

    return created;
  });

  // Return Full Project

  return prisma.project.findUnique({
    where: {
      id: project.id,
    },
    include: {
      statuses: {
        orderBy: {
          position: "asc",
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });
}

// ======================================================
// GET ALL PROJECTS
// ======================================================

export async function getProjects(userId: string) {
  return prisma.project.findMany({
    where: {
      members: {
        some: {
          userId,
        },
      },
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      statuses: {
        orderBy: {
          position: "asc",
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
      _count: {
        select: {
          issues: true,
          members: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

// ======================================================
// GET PROJECT BY ID
// ======================================================

export async function getProjectById(
  userId: string,
  projectId: string
) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      members: {
        some: {
          userId,
        },
      },
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      statuses: {
        orderBy: {
          position: "asc",
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
      issues: {
        where: {
          deletedAt: null,
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          reporter: {
            select: {
              id: true,
              name: true,
            },
          },
          status: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!project) {
    throw new ApiError(404, "Project not found.");
  }

  return project;
}

// ======================================================
// UPDATE PROJECT
// ======================================================

export async function updateProject(
  userId: string,
  projectId: string,
  body: any
) {
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new ApiError(403, "Access denied.");
  }

  if (membership.role !== Role.ADMIN) {
    throw new ApiError(
      403,
      "Only project administrators can update the project."
    );
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    throw new ApiError(404, "Project not found.");
  }

  const updateData: any = {};

  // ---------------- Name ----------------

  if (body.name !== undefined) {
    const name = body.name.trim();

    if (name.length < 2) {
      throw new ApiError(
        400,
        "Project name must contain at least 2 characters."
      );
    }

    if (name.length > 100) {
      throw new ApiError(
        400,
        "Project name cannot exceed 100 characters."
      );
    }

    updateData.name = name;
  }

  // ---------------- Description ----------------

  if (body.description !== undefined) {
    if (
      body.description &&
      body.description.length > 500
    ) {
      throw new ApiError(
        400,
        "Description cannot exceed 500 characters."
      );
    }

    updateData.description =
      body.description?.trim() || null;
  }

  // ---------------- Project Key ----------------

  if (body.key !== undefined) {
    const key = body.key
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10);

    const existing = await prisma.project.findFirst({
      where: {
        key,
        NOT: {
          id: projectId,
        },
      },
    });

    if (existing) {
      throw new ApiError(
        409,
        `Project key "${key}" already exists.`
      );
    }

    updateData.key = key;
  }

  const updated = await prisma.project.update({
    where: {
      id: projectId,
    },
    data: updateData,
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      statuses: {
        orderBy: {
          position: "asc",
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  return updated;
}


// ======================================================
// AUTHORIZATION HELPERS
// ======================================================

async function requireProjectMember(
  projectId: string,
  userId: string
) {
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  if (!member) {
    throw new ApiError(403, "You are not a member of this project.");
  }

  return member;
}

async function requireProjectAdmin(
  projectId: string,
  userId: string
) {
  const member = await requireProjectMember(
    projectId,
    userId
  );

  if (member.role !== Role.ADMIN) {
    throw new ApiError(
      403,
      "Only project administrators can perform this action."
    );
  }

  return member;
}

// ======================================================
// INVITE MEMBER
// ======================================================

export async function inviteMember(
  currentUserId: string,
  projectId: string,
  body: any
) {
  await requireProjectAdmin(projectId, currentUserId);

  const { email, role = Role.MEMBER } = body;

  if (!email) {
    throw new ApiError(400, "Email is required.");
  }

  if (![Role.MEMBER, Role.VIEWER].includes(role)) {
    throw new ApiError(
      400,
      "Role must be MEMBER or VIEWER."
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const exists = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: user.id,
      },
    },
  });

  if (exists) {
    throw new ApiError(
      409,
      "User is already a member of this project."
    );
  }

  return prisma.projectMember.create({
    data: {
      projectId,
      userId: user.id,
      role,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });
}

// ======================================================
// REMOVE MEMBER
// ======================================================

export async function removeMember(
  currentUserId: string,
  projectId: string,
  memberId: string
) {
  await requireProjectAdmin(projectId, currentUserId);

  if (currentUserId === memberId) {
    throw new ApiError(
      400,
      "You cannot remove yourself from the project."
    );
  }

  await prisma.projectMember.delete({
    where: {
      projectId_userId: {
        projectId,
        userId: memberId,
      },
    },
  });

  return true;
}

// ======================================================
// CHANGE MEMBER ROLE
// ======================================================

export async function changeMemberRole(
  currentUserId: string,
  projectId: string,
  memberId: string,
  role: Role
) {
  await requireProjectAdmin(projectId, currentUserId);

  if (role === Role.ADMIN) {
    throw new ApiError(
      400,
      "Use transfer ownership instead."
    );
  }

  return prisma.projectMember.update({
    where: {
      projectId_userId: {
        projectId,
        userId: memberId,
      },
    },
    data: {
      role,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });
}

// ======================================================
// DELETE PROJECT
// ======================================================

export async function deleteProject(
  currentUserId: string,
  projectId: string
) {
  await requireProjectAdmin(projectId, currentUserId);

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    throw new ApiError(404, "Project not found.");
  }

  if (project.ownerId !== currentUserId) {
    throw new ApiError(
      403,
      "Only the project owner can delete this project."
    );
  }

  await prisma.project.delete({
    where: {
      id: projectId,
    },
  });

  return true;
}



// =====================================================
// Helper
// =====================================================


async function verifyProjectMember(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });

  if (!member) {
    throw new ApiError(403, "You are not a member of this project.");
  }

  return member;
}

async function verifyProjectAdmin(projectId: string, userId: string) {
  const member = await verifyProjectMember(projectId, userId);

  if (member.role !== Role.ADMIN) {
    throw new ApiError(
      403,
      "Only project admins can perform this action."
    );
  }

  return member;
}

//
// =====================================================
// GET PROJECT MEMBERS
// =====================================================
//

export async function getProjectMembers(
  projectId: string,
  userId: string
) {
  await verifyProjectMember(projectId, userId);

  return prisma.projectMember.findMany({
    where: {
      projectId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      joinedAt: "asc",
    },
  });
}

//
// =====================================================
// GET PROJECT STATUSES
// =====================================================
//

export async function getProjectStatuses(
  projectId: string,
  userId: string
) {
  await verifyProjectMember(projectId, userId);

  return prisma.status.findMany({
    where: {
      projectId,
    },
    orderBy: {
      position: "asc",
    },
  });
}

//
// =====================================================
// CREATE STATUS
// =====================================================
//

export async function createStatus(
  projectId: string,
  userId: string,
  body: any
) {
  await verifyProjectAdmin(projectId, userId);

  const {
    name,
    color = "#CBD5E1",
    category = StatusCategory.TODO,
  } = body;

  if (!name) {
    throw new ApiError(400, "Status name is required.");
  }

  const count = await prisma.status.count({
    where: {
      projectId,
    },
  });

  return prisma.status.create({
    data: {
      projectId,
      name,
      color,
      category,
      position: count + 1,
    },
  });
}


// =====================================================
// UPDATE STATUS
// =====================================================

export async function updateStatus(
  statusId: string,
  userId: string,
  body: any
) {
  const status = await prisma.status.findUnique({
    where: { id: statusId },
  });

  if (!status) {
    throw new ApiError(404, "Status not found.");
  }

  await verifyProjectAdmin(status.projectId, userId);

  return prisma.status.update({
    where: {
      id: statusId,
    },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.color && { color: body.color }),
      ...(body.category && { category: body.category }),
    },
  });
}

// =====================================================
// DELETE STATUS
// =====================================================

export async function deleteStatus(
  statusId: string,
  userId: string
) {
  const status = await prisma.status.findUnique({
    where: { id: statusId },
    include: {
      issues: {
        take: 1,
      },
    },
  });

  if (!status) {
    throw new ApiError(404, "Status not found.");
  }

  await verifyProjectAdmin(status.projectId, userId);

  if (status.isDefault) {
    throw new ApiError(400, "Default status cannot be deleted.");
  }

  if (status.issues.length > 0) {
    throw new ApiError(
      400,
      "Cannot delete a status that contains issues."
    );
  }

  await prisma.status.delete({
    where: {
      id: statusId,
    },
  });

  return true;
}

// =====================================================
// REORDER STATUSES
// =====================================================

export async function reorderStatuses(
  projectId: string,
  userId: string,
  statuses: { id: string; position: number }[]
) {
  await verifyProjectAdmin(projectId, userId);

  await prisma.$transaction(
    statuses.map((status) =>
      prisma.status.update({
        where: {
          id: status.id,
        },
        data: {
          position: status.position,
        },
      })
    )
  );

  return prisma.status.findMany({
    where: {
      projectId,
    },
    orderBy: {
      position: "asc",
    },
  });
}