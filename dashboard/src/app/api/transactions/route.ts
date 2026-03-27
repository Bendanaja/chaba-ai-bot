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
    const type = searchParams.get("type") || "";
    const offset = (page - 1) * limit;

    // Count total
    let countQuery = supabase
      .from("transactions")
      .select("*", { count: "exact", head: true });

    if (userId) {
      countQuery = countQuery.eq("user_id", userId);
    }
    if (type && ["topup", "spend", "refund"].includes(type)) {
      countQuery = countQuery.eq("type", type);
    }

    const { count: total } = await countQuery;

    // Get transactions
    let txQuery = supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) {
      txQuery = txQuery.eq("user_id", userId);
    }
    if (type && ["topup", "spend", "refund"].includes(type)) {
      txQuery = txQuery.eq("type", type);
    }

    const { data: transactions } = await txQuery;

    // Enrich with display_name
    const userIds = [
      ...new Set((transactions || []).map((t) => t.user_id).filter(Boolean)),
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

    const enrichedTx = (transactions || []).map((t) => ({
      ...t,
      display_name: displayNameMap.get(t.user_id) || null,
    }));

    return NextResponse.json({
      transactions: enrichedTx,
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Transactions list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
