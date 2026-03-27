import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import supabase from "@/lib/db";

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

    // Count total
    let countQuery = supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (search) {
      countQuery = countQuery.or(
        `user_id.ilike.%${search}%,display_name.ilike.%${search}%`
      );
    }

    const { count: total } = await countQuery;

    // Get users
    let usersQuery = supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      usersQuery = usersQuery.or(
        `user_id.ilike.%${search}%,display_name.ilike.%${search}%`
      );
    }

    const { data: users } = await usersQuery;

    // Get task counts and transaction counts per user for the returned users
    const userIds = (users || []).map((u) => u.user_id);

    let taskCountMap = new Map<string, number>();
    let txCountMap = new Map<string, number>();

    if (userIds.length > 0) {
      const { data: taskCounts } = await supabase
        .from("tasks")
        .select("user_id")
        .in("user_id", userIds);

      for (const t of taskCounts || []) {
        taskCountMap.set(t.user_id, (taskCountMap.get(t.user_id) || 0) + 1);
      }

      const { data: txCounts } = await supabase
        .from("transactions")
        .select("user_id")
        .in("user_id", userIds);

      for (const t of txCounts || []) {
        txCountMap.set(t.user_id, (txCountMap.get(t.user_id) || 0) + 1);
      }
    }

    const enrichedUsers = (users || []).map((u) => ({
      ...u,
      task_count: taskCountMap.get(u.user_id) || 0,
      tx_count: txCountMap.get(u.user_id) || 0,
    }));

    return NextResponse.json({
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
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
