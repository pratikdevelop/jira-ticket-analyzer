// lib/api-middleware.ts
// ─────────────────────────────────────────────────────────────────
// Composable middleware for Next.js App Router API routes.
// Usage:  export const POST = withAuth(withRole("ADMIN")(handler))
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jsonwebtoken from "jsonwebtoken";
// ── Types ────────────────────────────────────────────────────────

export type ApiHandler = (
    req: NextRequest,
    context: RouteContext
) => Promise<NextResponse>;

export type RouteContext = {
    params: Promise<Record<string, string>>;
    user: {
        id: string;
        email: string;
        name: string | null;
    };
    projectRole?: "ADMIN" | "MEMBER" | "VIEWER";
};

// ── 1. withAuth ──────────────────────────────────────────────────
// Verifies the user is logged in via NextAuth session.
// Attaches user to context so inner handlers never call getServerSession again.

export function withAuth(handler: ApiHandler) {
    return async (
        req: NextRequest,
        context: { params: Promise<Record<string, string>> }
    ): Promise<NextResponse> => {
        let token: any = req.headers.get("authorization")?.replace("Bearer ", "");
        console.log("withAuth token:", typeof(token));
        console.log("withAuth cookies:", !token ? "No token found" : "Token found, skipping cookies");

        if (!token || token === "null") {
            return NextResponse.json(
                { error: { code: "UNAUTHORIZED", message: "You must be logged in.", status: 401 } },
                { status: 401 }
            );
        };
        const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET || "secret") as any;
        const userId = decoded.userId;

        if (!userId) {
            return NextResponse.json(
                { error: { code: "UNAUTHORIZED", message: "You must be logged in.", status: 401 } },
                { status: 401 }
            );
        }
        const u: any = await prisma.user.findUnique({
            where: {
                id: userId,
            },
        });


        return handler(req, {
            ...context,
            user: {
                id: userId,
                email: u.email,
                name: u?.name ?? null,
            },
        });
    };
}

// ── 2. withRole ──────────────────────────────────────────────────
// Checks the user has the required role on the project.
// Reads projectId OR projectKey from req URL search params or route params.
// Must be used AFTER withAuth — depends on context.user being set.

export function withRole(requiredRole: "ADMIN" | "MEMBER" | "VIEWER") {
    return function (handler: ApiHandler) {
        return async (req: NextRequest, context: RouteContext): Promise<NextResponse> => {
            const params = await context.params;

            // Accept projectId from route params, body, or query string
            const url = new URL(req.url);
            const projectId =
                params.projectId ||
                url.searchParams.get("projectId") ||
                undefined;

            if (!projectId) {
                return NextResponse.json(
                    { error: { code: "VALIDATION_ERROR", message: "projectId is required.", status: 400 } },
                    { status: 400 }
                );
            }

            const member = await prisma.projectMember.findUnique({
                where: {
                    projectId_userId: {
                        projectId,
                        userId: context.user.id,
                    },
                },
            });

            if (!member) {
                return NextResponse.json(
                    { error: { code: "FORBIDDEN", message: "You are not a member of this project.", status: 403 } },
                    { status: 403 }
                );
            }

            const roleRank = { VIEWER: 0, MEMBER: 1, ADMIN: 2 };
            if (roleRank[member.role] < roleRank[requiredRole]) {
                return NextResponse.json(
                    { error: { code: "FORBIDDEN", message: `This action requires ${requiredRole} role.`, status: 403 } },
                    { status: 403 }
                );
            }

            return handler(req, { ...context, projectRole: member.role });
        };
    };
}