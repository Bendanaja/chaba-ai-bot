import Database, { type Database as DatabaseType } from "better-sqlite3";
import path from "path";

const dataDir = process.env.DB_PATH
  ? process.env.DB_PATH
  : path.join(process.cwd(), "..");

const dbPath = path.join(dataDir, "chaba.db");

const db: DatabaseType = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export default db;
