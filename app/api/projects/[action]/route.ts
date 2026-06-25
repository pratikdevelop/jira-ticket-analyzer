// app/api/projects/[action]/route.ts
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth, withRole, ApiHandler, RouteContext } from "@/lib/api-middleware";

// ── Key generator ────────────────────────────────────────────────

async function generateUniqueKey(name: string): Promise<string> {
  // Build base key from initials of each word e.g. "My Awesome App" → "MAA"
  const words = name.trim().split(/\s+/);
  let base =
    words.length === 1
      ? name.slice(0, 4).toUpperCase()              // single word → first 4 chars
      : words.map((w) => w[0].toUpperCase()).join(""); // multi word → initials

  // Strip non-alphanumeric, cap at 10 chars
  base = base.replace(/[^A-Z0-9]/g, "").slice(0, 10);
  if (!base) base = "PROJ";

  // Find a unique key — append suffix if taken: MAA → MAA2 → MAA3
  let candidate = base;
  let suffix = 2;
  while (await prisma.project.findUnique({ where: { key: candidate } })) {
    candidate = `${base}${suffix}`;
    suffix++;
  }
  return candidate;
}

// ── createProject ────────────────────────────────────────────────
// Auth required. No role check — any logged-in user can create a project.

const createProject: ApiHandler = async (
  req: NextRequest,
  context: RouteContext
) => {
  try {
    const body = await req.json();
    let { name, description } = body;
    let key: string = body.key ?? "";

    // ── Validation ──────────────────────────────────────────────
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Project name must be at least 2 characters.", status: 400 } },
        { status: 400 }
      );
    }
    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Project name must be 100 characters or fewer.", status: 400 } },
        { status: 400 }
      );
    }
    if (description && description.length > 500) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Description must be 500 characters or fewer.", status: 400 } },
        { status: 400 }
      );
    }

    // ── Key handling ────────────────────────────────────────────
    if (key) {
      // User provided a custom key — validate and check uniqueness
      key = key.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
      if (key.length === 0) {
        return NextResponse.json(
          { error: { code: "VALIDATION_ERROR", message: "Key must contain at least one alphanumeric character.", status: 400 } },
          { status: 400 }
        );
      }
      const existing = await prisma.project.findUnique({ where: { key } });
      if (existing) {
        return NextResponse.json(
          { error: { code: "KEY_ALREADY_EXISTS", message: `Key "${key}" is already taken.`, status: 409 } },
          { status: 409 }
        );
      }
    } else {
      // Auto-generate a unique key from the project name
      key = await generateUniqueKey(name.trim());
    }

    // ── Transaction: project + default statuses + owner member ──
    const project = await prisma.$transaction(async (tx) => {
      // 1. Create the project
      const newProject = await tx.project.create({
        data: {
          name:        name.trim(),
          key,
          description: description?.trim() ?? null,
          ownerId:     context.user.id,   // from withAuth — never hardcode
        },
      });

      // 2. Seed the 4 default status columns
      await tx.status.createMany({
        data: [
          { name: "To Do",       color: "#E2E8F0", category: "TODO",        position: 1, isDefault: true,  projectId: newProject.id },
          { name: "In Progress", color: "#DBEAFE", category: "IN_PROGRESS", position: 2, isDefault: false, projectId: newProject.id },
          { name: "In Review",   color: "#FEF3C7", category: "IN_PROGRESS", position: 3, isDefault: false, projectId: newProject.id },
          { name: "Done",        color: "#DCFCE7", category: "DONE",        position: 4, isDefault: false, projectId: newProject.id },
        ],
      });

      // 3. Add creator as ADMIN member
      await tx.projectMember.create({
        data: {
          projectId: newProject.id,
          userId:    context.user.id,
          role:      "ADMIN",
        },
      });

      return newProject;
    });

    // ── Return created project with statuses ────────────────────
    const projectWithDetails = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        statuses: { orderBy: { position: "asc" } },
        members:  { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
      },
    });

    return NextResponse.json({ data: projectWithDetails, success: true, message: "Project created successfully." }, { status: 201 });

  } catch (error: any) {
    console.error("[createProject]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred.", status: 500 } },
      { status: 500 }
    );
  }
};

const getProjects: ApiHandler = async (
  req: NextRequest,
  context: RouteContext
) => {
  try {
    const projects = await prisma.project.findMany({
        where: {
            members: {
                some: {
                    userId: context.user.id,
                },
            },
        },
        include: {
            statuses: { orderBy: { position: "asc" } },
            members:  { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
        },
    });
    return NextResponse.json({ data: projects, success: true }, { status: 200 });
    } catch (error: any) {
        console.error("[getProjects]", error);
        return NextResponse.json(
            { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred.", status: 500 } },
                { status: 500 }
        )    }
};



// ── inviteMember ─────────────────────────────────────────────────
// Auth required. ADMIN role required on the project.

const inviteMember: ApiHandler = async (
  req: NextRequest,
  context: RouteContext
) => {
  try {
    const { email, role = "MEMBER", projectId } = await req.json();

    if (!email || !projectId) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "email and projectId are required.", status: 400 } },
        { status: 400 }
      );
    }
    if (role === "ADMIN") {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Cannot assign ADMIN role via invite. Promote after joining.", status: 400 } },
        { status: 400 }
      );
    }
    if (!["MEMBER", "VIEWER"].includes(role)) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Role must be MEMBER or VIEWER.", status: 400 } },
        { status: 400 }
      );
    }

    // Find the user to invite
    const invitee = await prisma.user.findUnique({ where: { email } });
    if (!invitee) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: `No account found for ${email}.`, status: 404 } },
        { status: 404 }
      );
    }

    // Check not already a member
    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: invitee.id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: { code: "ALREADY_A_MEMBER", message: "This user is already a member of the project.", status: 409 } },
        { status: 409 }
      );
    }

    const member = await prisma.projectMember.create({
      data: { projectId, userId: invitee.id, role },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    });

    return NextResponse.json({ data: member }, { status: 201 });

  } catch (error: any) {
    console.error("[inviteMember]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred.", status: 500 } },
      { status: 500 }
    );
  }
};


// ✅ Correct — separate GET export
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;

  switch (action) {
    case "get_projects":
      return withAuth(getProjects)(req, { params: Promise.resolve({}) } as any);

    default:
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Invalid action.", status: 404 } },
        { status: 404 }
      );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> }
) {
  const { action } = await params;

  switch (action) {
    case "create":
      return withAuth(createProject)(req, { params: Promise.resolve({}) } as any);

    case "invite_member":
      return withAuth(withRole("ADMIN")(inviteMember))(req, { params: Promise.resolve({}) } as any);

    default:
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Invalid action.", status: 404 } },
        { status: 404 }
      );
  }
}