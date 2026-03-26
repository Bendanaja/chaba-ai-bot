import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );
    const userId = searchParams.get("userId") || "";
    const status = searchParams.get("status") || "";
    const model = searchParams.get("model") || "";
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const queryParams: unknown[] = [];

    if (userId) {
      conditions.push("t.user_id = ?");
      queryParams.push(userId);
    }

    if (status) {
      conditions.push("t.status = ?");
      queryParams.push(status);
    }

    if (model) {
      conditions.push("t.model = ?");
      queryParams.push(model);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count total
    const countRow = db
      .prepare(`SELECT COUNT(*) as count FROM tasks t ${whereClause}`)
      .get(...queryParams) as { count: number };

    // Get tasks with user display_name
    const tasks = db
      .prepare(
        `SELECT
          t.*,
          u.display_name
        FROM tasks t
        LEFT JOIN users u ON t.user_id = u.user_id
        ${whereClause}
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?`
      )
      .all(...queryParams, limit, offset);

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total: countRow.count,
        totalPages: Math.ceil(countRow.count / limit),
      },
    });
  } catch (error) {
    console.error("Tasks list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
