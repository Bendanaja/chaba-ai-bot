import pg from "pg";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:7b557aeac48acab0c18ea97e370fba4c8be8aaf3@72.61.112.117:6432/postgres";

const client = new pg.Client({ connectionString: DATABASE_URL });

async function main() {
  await client.connect();
  console.log("Connected to database");

  await client.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      type TEXT DEFAULT 'invoice' CHECK(type IN ('invoice', 'quotation')),
      customer_name TEXT NOT NULL,
      customer_address TEXT,
      customer_phone TEXT,
      customer_email TEXT,
      items JSONB NOT NULL DEFAULT '[]',
      subtotal REAL DEFAULT 0,
      tax_rate REAL DEFAULT 7,
      tax_amount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'paid', 'cancelled')),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log("invoices table created (or already exists)");
  await client.end();
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
