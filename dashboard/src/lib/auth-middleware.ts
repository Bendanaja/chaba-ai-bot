import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./auth";

/**
 * Checks admin_token cookie for a valid session.
 * Returns null if the request is authenticated.
 * Returns a 401 NextResponse if authentication fails.
 */
export function requireAuth(request: NextRequest): NextResponse | null {
  const token = request.cookies.get("admin_token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized: No token provided" },
      { status: 401 }
    );
  }

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const payload = verifyToken(token, secret);
  if (!payload) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or expired token" },
      { status: 401 }
    );
  }

  return null;
}
