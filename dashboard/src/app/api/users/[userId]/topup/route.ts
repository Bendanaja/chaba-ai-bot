import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import db from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { userId } = await params;
    const body = await request.json();
    const { amount, description } = body;

    if (typeof amount !== "number" || amount <= 0 || amount > 100000) {
      return NextResponse.json(
        { error: "Amount must be between 0 and 100,000" },
        { status: 400 }
      );
    }

    // Check user exists
    const user = db
      .prepare("SELECT * FROM users WHERE user_id = ?")
      .get(userId) as { user_id: string; balance: number } | undefined;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update balance and insert transaction in a single transaction
    const topup = db.transaction(() => {
      db.prepare(
        "UPDATE users SET balance = balance + ?, updated_at = datetime('now') WHERE user_id = ?"
      ).run(amount, userId);

      db.prepare(
        "INSERT INTO transactions (user_id, type, amount, description) VALUES (?, 'topup', ?, ?)"
      ).run(userId, amount, description || `Top up ${amount} THB`);

      return db
        .prepare("SELECT * FROM users WHERE user_id = ?")
        .get(userId);
    });

    const updated = topup();

    return NextResponse.json({ user: updated });
  } catch {
    return NextResponse.json(
      { error: "Failed to top up credits" },
      { status: 500 }
    );
  }
}
