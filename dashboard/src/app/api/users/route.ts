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
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    let whereClause = "";
    const queryParams: unknown[] = [];

    if (search) {
      whereClause = "WHERE u.user_id LIKE ? OR u.display_name LIKE ?";
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Count total
    const countRow = db
      .prepare(
        `SELECT COUNT(*) as count FROM users u ${whereClause}`
      )
      .get(...queryParams) as {
      count: number;
    };

    // Get users with task and transaction counts
    const users = db
      .prepare(
        `SELECT
          u.*,
          COALESCE(tc.task_count, 0) as task_count,
          COALESCE(txc.tx_count, 0) as tx_count
        FROM users u
        LEFT JOIN (
          SELECT user_id, COUNT(*) as task_count
          FROM tasks
          GROUP BY user_id
        ) tc ON u.user_id = tc.user_id
        LEFT JOIN (
          SELECT user_id, COUNT(*) as tx_count
          FROM transactions
          GROUP BY user_id
        ) txc ON u.user_id = txc.user_id
        ${whereClause}
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?`
      )
      .all(...queryParams, limit, offset);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: countRow.count,
        totalPages: Math.ceil(countRow.count / limit),
      },
    });
  } catch (error) {
    console.error("Users list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
