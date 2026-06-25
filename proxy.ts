// middleware.ts

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export  function proxy(request: NextRequest) {
   let token = request.cookies.get("token")?.value;
     console.log("Token from getTokenFromCookies:", token)
   


  if (!token) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET || "secret");

    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
};