import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import supabase from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Invoice detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();

    const { data: existing } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const allowedFields = [
      "customer_name",
      "customer_address",
      "customer_phone",
      "customer_email",
      "items",
      "tax_rate",
      "status",
      "notes",
      "type",
    ];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (updateData.items || updateData.tax_rate) {
      const items = (updateData.items || existing.items) as Array<{
        quantity?: number;
        unit_price?: number;
      }>;
      const taxRate = (updateData.tax_rate ?? existing.tax_rate) as number;
      const subtotal = items.reduce(
        (sum, item) => sum + (item.quantity || 0) * (item.unit_price || 0),
        0
      );
      const taxAmount = subtotal * (taxRate / 100);
      updateData.subtotal = subtotal;
      updateData.tax_amount = taxAmount;
      updateData.total = subtotal + taxAmount;
    }

    updateData.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from("invoices")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Invoice update error:", error);
      return NextResponse.json(
        { error: "Failed to update invoice" },
        { status: 500 }
      );
    }

    return NextResponse.json({ invoice: updated });
  } catch (error) {
    console.error("Invoice update error:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;

    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Invoice delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete invoice" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Invoice delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
