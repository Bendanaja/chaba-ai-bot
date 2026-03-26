import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    // Total users
    const totalUsersRow = db
      .prepare("SELECT COUNT(*) as count FROM users")
      .get() as { count: number };

    // Revenue (topup), Spent, Refunded
    const revenueRow = db
      .prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'topup'"
      )
      .get() as { total: number };

    const spentRow = db
      .prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'spend'"
      )
      .get() as { total: number };

    const refundedRow = db
      .prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'refund'"
      )
      .get() as { total: number };

    // Tasks stats
    const totalTasksRow = db
      .prepare("SELECT COUNT(*) as count FROM tasks")
      .get() as { count: number };

    const activeTasksRow = db
      .prepare(
        "SELECT COUNT(*) as count FROM tasks WHERE status IN ('pending', 'processing')"
      )
      .get() as { count: number };

    const successTasksRow = db
      .prepare(
        "SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'"
      )
      .get() as { count: number };

    const failedTasksRow = db
      .prepare(
        "SELECT COUNT(*) as count FROM tasks WHERE status = 'failed'"
      )
      .get() as { count: number };

    // Today stats
    const todayRevenueRow = db
      .prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'topup' AND date(created_at) = date('now')"
      )
      .get() as { total: number };

    const todayTasksRow = db
      .prepare(
        "SELECT COUNT(*) as count FROM tasks WHERE date(created_at) = date('now')"
      )
      .get() as { count: number };

    // Daily stats for last 7 days
    const dailyStats = db
      .prepare(
        `SELECT
          date(created_at) as date,
          COALESCE(SUM(CASE WHEN type = 'topup' THEN amount ELSE 0 END), 0) as revenue,
          COALESCE(SUM(CASE WHEN type = 'spend' THEN amount ELSE 0 END), 0) as spent,
          COUNT(*) as transactions
        FROM transactions
        WHERE created_at >= datetime('now', '-7 days')
        GROUP BY date(created_at)
        ORDER BY date(created_at) ASC`
      )
      .all() as Array<{
      date: string;
      revenue: number;
      spent: number;
      transactions: number;
    }>;

    // Popular models (top 10)
    const popularModels = db
      .prepare(
        `SELECT model, COUNT(*) as count
        FROM tasks
        GROUP BY model
        ORDER BY count DESC
        LIMIT 10`
      )
      .all() as Array<{ model: string; count: number }>;

    return NextResponse.json({
      totalUsers: totalUsersRow.count,
      totalRevenue: revenueRow.total,
      totalSpent: spentRow.total,
      totalRefunded: refundedRow.total,
      activeTasks: activeTasksRow.count,
      totalTasks: totalTasksRow.count,
      successTasks: successTasksRow.count,
      failedTasks: failedTasksRow.count,
      todayRevenue: todayRevenueRow.total,
      todayTasks: todayTasksRow.count,
      dailyStats,
      popularModels,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
