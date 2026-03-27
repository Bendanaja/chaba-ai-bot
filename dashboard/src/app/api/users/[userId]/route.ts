import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import supabase from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { userId } = await params;

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get task count
    const { count: taskCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Get transaction count
    const { count: txCount } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    return NextResponse.json({
      user: {
        ...user,
        task_count: taskCount || 0,
        tx_count: txCount || 0,
      },
    });
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
    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build dynamic update
    const allowedFields = ["display_name", "selected_model", "balance"];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    updateData.updated_at = new Date().toISOString();

    const { data: updated } = await supabase
      .from("users")
      .update(updateData)
      .eq("user_id", userId)
      .select()
      .single();

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
