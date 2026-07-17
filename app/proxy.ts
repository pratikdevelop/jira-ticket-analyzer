// middleware.ts

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function proxy(request: NextRequest) {
  // Get Access Token from Cookie
  let accessToken = request.cookies.get("accessToken")?.value;

  // Public Routes
  const publicRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];

  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }
  console.log("Access Token:", accessToken);
  // No token → Login
  if (!accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    jwt.verify(
      accessToken,
      process.env.JWT_SECRET || "JWT_SECRET"
    );

    return NextResponse.next();
  } catch (error) {
    console.error("Invalid Token:", error);

    return NextResponse.redirect(
      new URL("/login", request.url)
    );

    // response.cookies.delete("accessToken");
    // response.cookies.delete("refreshToken");

    // return response;
  }
}

export const config = {
  matcher: [
    /*
     * Skip API routes, static files, images, favicon, etc.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};