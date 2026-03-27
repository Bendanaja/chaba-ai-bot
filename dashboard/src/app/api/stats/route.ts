import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import supabase from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    // Total users
    const { count: totalUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    // Revenue (topup)
    const { data: topupRows } = await supabase
      .from("transactions")
      .select("amount")
      .eq("type", "topup");
    const totalRevenue = (topupRows || []).reduce((sum, r) => sum + (r.amount || 0), 0);

    // Spent
    const { data: spentRows } = await supabase
      .from("transactions")
      .select("amount")
      .eq("type", "spend");
    const totalSpent = (spentRows || []).reduce((sum, r) => sum + (r.amount || 0), 0);

    // Refunded
    const { data: refundRows } = await supabase
      .from("transactions")
      .select("amount")
      .eq("type", "refund");
    const totalRefunded = (refundRows || []).reduce((sum, r) => sum + (r.amount || 0), 0);

    // Tasks stats
    const { count: totalTasks } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true });

    const { count: activeTasks } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "processing"]);

    const { count: successTasks } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    const { count: failedTasks } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed");

    // Today stats
    const todayStr = new Date().toISOString().split("T")[0];
    const { data: todayTopupRows } = await supabase
      .from("transactions")
      .select("amount")
      .eq("type", "topup")
      .gte("created_at", `${todayStr}T00:00:00`)
      .lt("created_at", `${todayStr}T23:59:59.999999`);
    const todayRevenue = (todayTopupRows || []).reduce((sum, r) => sum + (r.amount || 0), 0);

    const { count: todayTasks } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .gte("created_at", `${todayStr}T00:00:00`)
      .lt("created_at", `${todayStr}T23:59:59.999999`);

    // Daily stats for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: recentTx } = await supabase
      .from("transactions")
      .select("created_at, type, amount")
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    const dailyMap = new Map<string, { revenue: number; spent: number; transactions: number }>();
    for (const tx of recentTx || []) {
      const date = tx.created_at.split("T")[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { revenue: 0, spent: 0, transactions: 0 });
      }
      const day = dailyMap.get(date)!;
      day.transactions++;
      if (tx.type === "topup") day.revenue += tx.amount || 0;
      if (tx.type === "spend") day.spent += tx.amount || 0;
    }
    const dailyStats = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Popular models (top 10)
    const { data: allTasks } = await supabase
      .from("tasks")
      .select("model");
    const modelCounts = new Map<string, number>();
    for (const t of allTasks || []) {
      if (t.model) {
        modelCounts.set(t.model, (modelCounts.get(t.model) || 0) + 1);
      }
    }
    const popularModels = Array.from(modelCounts.entries())
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalRevenue,
      totalSpent,
      totalRefunded,
      activeTasks: activeTasks || 0,
      totalTasks: totalTasks || 0,
      successTasks: successTasks || 0,
      failedTasks: failedTasks || 0,
      todayRevenue,
      todayTasks: todayTasks || 0,
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
