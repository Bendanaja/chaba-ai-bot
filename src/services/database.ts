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
