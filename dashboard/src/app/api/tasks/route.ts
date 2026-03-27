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
    const userId = searchParams.get("userId") || "";
    const status = searchParams.get("status") || "";
    const model = searchParams.get("model") || "";
    const offset = (page - 1) * limit;

    // Count total
    let countQuery = supabase
      .from("tasks")
      .select("*", { count: "exact", head: true });

    if (userId) {
      countQuery = countQuery.eq("user_id", userId);
    }
    if (status) {
      countQuery = countQuery.eq("status", status);
    }
    if (model) {
      countQuery = countQuery.eq("model", model);
    }

    const { count: total } = await countQuery;

    // Get tasks
    let tasksQuery = supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) {
      tasksQuery = tasksQuery.eq("user_id", userId);
    }
    if (status) {
      tasksQuery = tasksQuery.eq("status", status);
    }
    if (model) {
      tasksQuery = tasksQuery.eq("model", model);
    }

    const { data: tasks } = await tasksQuery;

    // Enrich with display_name
    const userIds = [
      ...new Set((tasks || []).map((t) => t.user_id).filter(Boolean)),
    ];
    let displayNameMap = new Map<string, string>();

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("user_id, display_name")
        .in("user_id", userIds);

      for (const u of users || []) {
        displayNameMap.set(u.user_id, u.display_name);
      }
    }

    const enrichedTasks = (tasks || []).map((t) => ({
      ...t,
      display_name: displayNameMap.get(t.user_id) || null,
    }));

    return NextResponse.json({
      tasks: enrichedTasks,
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
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
