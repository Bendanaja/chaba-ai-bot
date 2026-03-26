import Database, { type Database as DatabaseType } from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env["DB_PATH"] || path.join(__dirname, "..", "..");
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, "chaba.db");

const db: DatabaseType = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    display_name TEXT,
    balance REAL DEFAULT 0,
    selected_model TEXT DEFAULT 'flux-2/pro-text-to-image',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('topup', 'spend', 'refund')),
    amount REAL NOT NULL,
    description TEXT,
    task_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    task_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    model TEXT NOT NULL,
    api_type TEXT NOT NULL,
    prompt TEXT,
    status TEXT DEFAULT 'pending',
    result_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
  );
`);

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

export function getOrCreateUser(userId: string, displayName?: string): User {
  const existing = db
    .prepare("SELECT * FROM users WHERE user_id = ?")
    .get(userId) as User | undefined;

  if (existing) return existing;

  db.prepare(
    "INSERT INTO users (user_id, display_name) VALUES (?, ?)"
  ).run(userId, displayName || null);

  return db
    .prepare("SELECT * FROM users WHERE user_id = ?")
    .get(userId) as User;
}

export function getBalance(userId: string): number {
  const user = db
    .prepare("SELECT balance FROM users WHERE user_id = ?")
    .get(userId) as { balance: number } | undefined;
  return user?.balance ?? 0;
}

export function getSelectedModel(userId: string): string {
  const user = db
    .prepare("SELECT selected_model FROM users WHERE user_id = ?")
    .get(userId) as { selected_model: string } | undefined;
  return user?.selected_model ?? "flux-2/pro-text-to-image";
}

export function setSelectedModel(userId: string, modelId: string): void {
  db.prepare(
    "UPDATE users SET selected_model = ?, updated_at = datetime('now') WHERE user_id = ?"
  ).run(modelId, userId);
}

// ==================== Wallet ====================

export function topUp(userId: string, amount: number, description?: string): number {
  const txn = db.transaction(() => {
    db.prepare(
      "UPDATE users SET balance = balance + ?, updated_at = datetime('now') WHERE user_id = ?"
    ).run(amount, userId);

    db.prepare(
      "INSERT INTO transactions (user_id, type, amount, description) VALUES (?, 'topup', ?, ?)"
    ).run(userId, amount, description || `Top up ${amount} THB`);

    return getBalance(userId);
  });
  return txn();
}

export function spend(
  userId: string,
  amount: number,
  description: string,
  taskId?: string
): boolean {
  const txn = db.transaction(() => {
    const balance = getBalance(userId);
    if (balance < amount) return false;

    db.prepare(
      "UPDATE users SET balance = balance - ?, updated_at = datetime('now') WHERE user_id = ?"
    ).run(amount, userId);

    db.prepare(
      "INSERT INTO transactions (user_id, type, amount, description, task_id) VALUES (?, 'spend', ?, ?, ?)"
    ).run(userId, amount, description, taskId || null);

    return true;
  });
  return txn();
}

export function refund(
  userId: string,
  amount: number,
  description: string,
  taskId?: string
): void {
  db.transaction(() => {
    db.prepare(
      "UPDATE users SET balance = balance + ?, updated_at = datetime('now') WHERE user_id = ?"
    ).run(amount, userId);

    db.prepare(
      "INSERT INTO transactions (user_id, type, amount, description, task_id) VALUES (?, 'refund', ?, ?, ?)"
    ).run(userId, amount, description, taskId || null);
  })();
}

export function getTransactions(userId: string, limit = 10): Transaction[] {
  return db
    .prepare(
      "SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?"
    )
    .all(userId, limit) as Transaction[];
}

// ==================== Tasks ====================

export function saveTask(
  taskId: string,
  userId: string,
  model: string,
  apiType: string,
  prompt?: string
): void {
  db.prepare(
    "INSERT INTO tasks (task_id, user_id, model, api_type, prompt) VALUES (?, ?, ?, ?, ?)"
  ).run(taskId, userId, model, apiType, prompt || null);
}

export function getTask(taskId: string) {
  return db.prepare("SELECT * FROM tasks WHERE task_id = ?").get(taskId) as
    | { task_id: string; user_id: string; model: string; api_type: string; prompt: string | null; status: string; result_url: string | null }
    | undefined;
}

export function updateTaskStatus(
  taskId: string,
  status: string,
  resultUrl?: string
): void {
  db.prepare(
    "UPDATE tasks SET status = ?, result_url = ? WHERE task_id = ?"
  ).run(status, resultUrl || null, taskId);
}

export default db;
