import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-middleware";
import supabase from "@/lib/db";

export const dynamic = "force-dynamic";

async function generateInvoiceNumber(type: "invoice" | "quotation"): Promise<string> {
  const prefix = type === "invoice" ? "INV" : "QUO";
  const year = new Date().getFullYear();

  const { data } = await supabase
    .from("invoices")
    .select("invoice_number")
    .like("invoice_number", `${prefix}-${year}-%`)
    .order("invoice_number", { ascending: false })
    .limit(1);

  let nextNum = 1;
  if (data && data.length > 0) {
    const last = data[0].invoice_number;
    const parts = last.split("-");
    const num = parseInt(parts[2], 10);
    if (!isNaN(num)) nextNum = num + 1;
  }

  return `${prefix}-${year}-${String(nextNum).padStart(4, "0")}`;
}

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
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    let countQuery = supabase
      .from("invoices")
      .select("*", { count: "exact", head: true });

    if (status && ["draft", "sent", "paid", "cancelled"].includes(status)) {
      countQuery = countQuery.eq("status", status);
    }
    if (type && ["invoice", "quotation"].includes(type)) {
      countQuery = countQuery.eq("type", type);
    }
    if (search) {
      countQuery = countQuery.or(
        `customer_name.ilike.%${search}%,invoice_number.ilike.%${search}%`
      );
    }

    const { count: total } = await countQuery;

    let query = supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && ["draft", "sent", "paid", "cancelled"].includes(status)) {
      query = query.eq("status", status);
    }
    if (type && ["invoice", "quotation"].includes(type)) {
      query = query.eq("type", type);
    }
    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,invoice_number.ilike.%${search}%`
      );
    }

    const { data: invoices, error } = await query;

    if (error) {
      console.error("Invoices query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch invoices" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      invoices: invoices || [],
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Invoices list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();

    const docType = body.type === "quotation" ? "quotation" : "invoice";
    const invoiceNumber = await generateInvoiceNumber(docType);

    const items = Array.isArray(body.items) ? body.items : [];
    const taxRate = typeof body.tax_rate === "number" ? body.tax_rate : 7;

    const subtotal = items.reduce(
      (sum: number, item: { quantity?: number; unit_price?: number }) =>
        sum + (item.quantity || 0) * (item.unit_price || 0),
      0
    );
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        type: docType,
        customer_name: body.customer_name || "ไม่ระบุ",
        customer_address: body.customer_address || null,
        customer_phone: body.customer_phone || null,
        customer_email: body.customer_email || null,
        items,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        status: body.status || "draft",
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Invoice create error:", error);
      return NextResponse.json(
        { error: "Failed to create invoice" },
        { status: 500 }
      );
    }

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error("Invoice create error:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
