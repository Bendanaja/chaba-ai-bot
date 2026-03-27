import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import supabase from "@/lib/db";

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
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update balance
    const { error: updateError } = await supabase
      .from("users")
      .update({
        balance: user.balance + amount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) throw updateError;

    // Insert transaction
    const { error: txError } = await supabase.from("transactions").insert({
      user_id: userId,
      type: "topup",
      amount,
      description: description || `Top up ${amount} THB`,
    });

    if (txError) throw txError;

    // Fetch updated user
    const { data: updated } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", userId)
      .single();

    return NextResponse.json({ user: updated });
  } catch {
    return NextResponse.json(
      { error: "Failed to top up credits" },
      { status: 500 }
    );
  }
}
