import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface User {
  user_id: string;
  display_name: string | null;
  balance: number;
  selected_model: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  user_id: string;
  type: "topup" | "spend" | "refund";
  amount: number;
  description: string | null;
  task_id: string | null;
  created_at: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  type: string;
  customer_name: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status: string;
  notes: string | null;
  created_at: string;
}

// ==================== User ====================

export async function getOrCreateUser(
  userId: string,
  displayName?: string
): Promise<User> {
  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (existing) return existing as User;

  await supabase
    .from("users")
    .insert({ user_id: userId, display_name: displayName || null });

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", userId)
    .single();

  return data as User;
}

export async function getBalance(userId: string): Promise<number> {
  const { data } = await supabase
    .from("users")
    .select("balance")
    .eq("user_id", userId)
    .single();

  return data?.balance ?? 0;
}

export async function getSelectedModel(userId: string): Promise<string> {
  const { data } = await supabase
    .from("users")
    .select("selected_model")
    .eq("user_id", userId)
    .single();

  return data?.selected_model ?? "flux-2/pro-text-to-image";
}

export async function setSelectedModel(
  userId: string,
  modelId: string
): Promise<void> {
  await supabase
    .from("users")
    .update({ selected_model: modelId, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
}

// ==================== Wallet ====================

export async function topUp(
  userId: string,
  amount: number,
  description?: string
): Promise<number> {
  // Get current balance
  const { data: user } = await supabase
    .from("users")
    .select("balance")
    .eq("user_id", userId)
    .single();

  const newBalance = (user?.balance ?? 0) + amount;

  await supabase
    .from("users")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  await supabase.from("transactions").insert({
    user_id: userId,
    type: "topup",
    amount,
    description: description || `Top up ${amount} THB`,
  });

  return newBalance;
}

export async function spend(
  userId: string,
  amount: number,
  description: string,
  taskId?: string
): Promise<boolean> {
  const { data: user } = await supabase
    .from("users")
    .select("balance")
    .eq("user_id", userId)
    .single();

  const balance = user?.balance ?? 0;
  if (balance < amount) return false;

  const newBalance = balance - amount;

  await supabase
    .from("users")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  await supabase.from("transactions").insert({
    user_id: userId,
    type: "spend",
    amount,
    description,
    task_id: taskId || null,
  });

  return true;
}

export async function refund(
  userId: string,
  amount: number,
  description: string,
  taskId?: string
): Promise<void> {
  const { data: user } = await supabase
    .from("users")
    .select("balance")
    .eq("user_id", userId)
    .single();

  const newBalance = (user?.balance ?? 0) + amount;

  await supabase
    .from("users")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  await supabase.from("transactions").insert({
    user_id: userId,
    type: "refund",
    amount,
    description,
    task_id: taskId || null,
  });
}

export async function getTransactions(
  userId: string,
  limit = 10
): Promise<Transaction[]> {
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []) as Transaction[];
}

// ==================== Tasks ====================

export async function saveTask(
  taskId: string,
  userId: string,
  model: string,
  apiType: string,
  prompt?: string
): Promise<void> {
  await supabase.from("tasks").insert({
    task_id: taskId,
    user_id: userId,
    model,
    api_type: apiType,
    prompt: prompt || null,
  });
}

export async function getTask(taskId: string): Promise<
  | {
      task_id: string;
      user_id: string;
      model: string;
      api_type: string;
      prompt: string | null;
      status: string;
      result_url: string | null;
    }
  | undefined
> {
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("task_id", taskId)
    .single();

  return data ?? undefined;
}

export async function updateTaskStatus(
  taskId: string,
  status: string,
  resultUrl?: string
): Promise<void> {
  await supabase
    .from("tasks")
    .update({ status, result_url: resultUrl || null })
    .eq("task_id", taskId);
}

// ==================== Invoices ====================

export async function getNextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `RCP-${year}-`;

  const { data } = await supabase
    .from("invoices")
    .select("invoice_number")
    .like("invoice_number", `${prefix}%`)
    .order("invoice_number", { ascending: false })
    .limit(1);

  let seq = 1;
  if (data && data.length > 0) {
    const last = data[0].invoice_number as string;
    const num = parseInt(last.replace(prefix, ""), 10);
    if (!isNaN(num)) seq = num + 1;
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function createInvoice(data: {
  userId: string;
  customerName: string;
  items: InvoiceItem[];
  taskId?: string;
  notes?: string;
}): Promise<Invoice> {
  const invoiceNumber = await getNextInvoiceNumber();

  const subtotal = data.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );
  const taxRate = 0.07;
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  const row = {
    invoice_number: invoiceNumber,
    type: "receipt",
    customer_name: data.customerName,
    items: data.items,
    subtotal,
    tax_rate: taxRate,
    tax_amount: taxAmount,
    total,
    status: "paid",
    notes: data.notes || null,
    user_id: data.userId,
    task_id: data.taskId || null,
  };

  const { data: inserted, error } = await supabase
    .from("invoices")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    console.error("Create invoice error:", error);
    throw error;
  }

  return inserted as Invoice;
}

export async function getInvoicesByUser(
  userId: string,
  limit = 5
): Promise<Invoice[]> {
  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []) as Invoice[];
}
