import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { userId } = await params;

    const user = db
      .prepare(
        `SELECT
          u.*,
          COALESCE(tc.task_count, 0) as task_count,
          COALESCE(txc.tx_count, 0) as tx_count
        FROM users u
        LEFT JOIN (
          SELECT user_id, COUNT(*) as task_count
          FROM tasks
          WHERE user_id = ?
        ) tc ON u.user_id = tc.user_id
        LEFT JOIN (
          SELECT user_id, COUNT(*) as tx_count
          FROM transactions
          WHERE user_id = ?
        ) txc ON u.user_id = txc.user_id
        WHERE u.user_id = ?`
      )
      .get(userId, userId, userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("User detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { userId } = await params;
    const body = await request.json();

    // Check user exists
    const existing = db
      .prepare("SELECT * FROM users WHERE user_id = ?")
      .get(userId);

    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build dynamic update
    const allowedFields = ["display_name", "selected_model", "balance"];
    const updates: string[] = [];
    const values: unknown[] = [];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    updates.push("updated_at = datetime('now')");
    values.push(userId);

    db.prepare(
      `UPDATE users SET ${updates.join(", ")} WHERE user_id = ?`
    ).run(...values);

    const updated = db
      .prepare("SELECT * FROM users WHERE user_id = ?")
      .get(userId);

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
