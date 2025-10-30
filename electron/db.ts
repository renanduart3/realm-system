import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

type Row = Record<string, any>;

export class SqliteDB {
  private static instance: SqliteDB;
  private db?: Database.Database;
  private dbPath: string;

  private constructor() {
    const baseDir = app.getPath('userData');
    this.dbPath = path.join(baseDir, 'realm-system.db');
  }

  static getInstance(): SqliteDB {
    if (!SqliteDB.instance) SqliteDB.instance = new SqliteDB();
    return SqliteDB.instance;
  }

  getPath() { return this.dbPath; }

  ensureFile() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.dbPath)) {
      fs.writeFileSync(this.dbPath, '');
    }
  }

  open() {
    if (this.db) return;
    this.ensureFile();
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.createSchema();
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = undefined;
    }
  }

  reset() {
    this.close();
    if (fs.existsSync(this.dbPath)) fs.unlinkSync(this.dbPath);
    this.open();
  }

  private run(sql: string, params?: any) { return this.db!.prepare(sql).run(params ?? {}); }
  private all(sql: string, params?: any) { return this.db!.prepare(sql).all(params ?? {}); }
  private get(sql: string, params?: any) { return this.db!.prepare(sql).get(params ?? {}); }

  private createSchema() {
    const exec = (s: string) => this.db!.exec(s);
    // Core tables
    exec(`CREATE TABLE IF NOT EXISTS systemConfig (
      id TEXT PRIMARY KEY,
      organization_type TEXT,
      organization_name TEXT,
      currency TEXT,
      theme TEXT,
      require_auth INTEGER,
      google_sync_enabled INTEGER,
      sheet_ids TEXT,
      is_configured INTEGER,
      configured_at TEXT,
      subscription TEXT,
      created_at TEXT,
      updated_at TEXT
    )`);

    exec(`CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT,
      type TEXT,
      price REAL,
      quantity INTEGER,
      category TEXT,
      description TEXT,
      active INTEGER,
      created_at TEXT,
      updated_at TEXT
    )`);

    exec(`CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      phone TEXT,
      document TEXT,
      address TEXT,
      tags TEXT,
      notes TEXT,
      isWhatsApp INTEGER,
      created_at TEXT,
      updated_at TEXT
    )`);

    exec(`CREATE TABLE IF NOT EXISTS persons (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      phone TEXT,
      isWhatsApp INTEGER,
      birthDate TEXT,
      document TEXT,
      address TEXT,
      socialPrograms TEXT,
      familyIncome REAL,
      notes TEXT,
      created_at TEXT,
      updated_at TEXT
    )`);

    exec(`CREATE TABLE IF NOT EXISTS donors (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      phone TEXT,
      document TEXT,
      type TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT,
      updated_at TEXT
    )`);

    exec(`CREATE TABLE IF NOT EXISTS financialCategories (
      id TEXT PRIMARY KEY,
      name TEXT,
      type TEXT,
      created_at TEXT,
      updated_at TEXT
    )`);

    exec(`CREATE TABLE IF NOT EXISTS systemUsers (
      id TEXT PRIMARY KEY,
      username TEXT,
      email TEXT,
      password TEXT,
      role TEXT,
      nature_type TEXT,
      subscription TEXT,
      created_at TEXT,
      updated_at TEXT
    )`);

    exec(`CREATE TABLE IF NOT EXISTS invitationCodes (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE,
      user_gerente_id TEXT,
      created_at TEXT
    )`);

    exec(`CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      category TEXT,
      value REAL,
      date TEXT,
      time TEXT,
      client_id TEXT,
      person_id TEXT,
      related_transaction_id TEXT,
      interest_amount REAL,
      is_recurring INTEGER,
      description TEXT,
      status TEXT,
      due_date TEXT,
      notification_dismissed INTEGER,
      recurring_expense_id TEXT,
      created_at TEXT,
      updated_at TEXT
    )`);
    exec(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)`);
    exec(`CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)`);

    exec(`CREATE TABLE IF NOT EXISTS recurringExpenses (
      id TEXT PRIMARY KEY,
      description TEXT,
      amount REAL,
      dayOfMonthDue INTEGER,
      category TEXT,
      active INTEGER,
      created_at TEXT,
      updated_at TEXT
    )`);
    exec(`CREATE INDEX IF NOT EXISTS idx_recurring_active ON recurringExpenses(active)`);

    exec(`CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      date TEXT,
      time TEXT,
      value REAL,
      client_id TEXT,
      person_id TEXT,
      userId TEXT,
      description TEXT,
      created_at TEXT,
      updated_at TEXT
    )`);
    exec(`CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date)`);
    exec(`CREATE INDEX IF NOT EXISTS idx_sales_year ON sales((CAST(strftime('%Y', date) AS INT)))`);

    exec(`CREATE TABLE IF NOT EXISTS saleItems (
      id TEXT PRIMARY KEY,
      sale_id TEXT,
      product_service_id TEXT,
      quantity REAL,
      unit_price REAL,
      total_price REAL,
      created_at TEXT,
      updated_at TEXT
    )`);
    exec(`CREATE INDEX IF NOT EXISTS idx_saleitems_sale ON saleItems(sale_id)`);

    exec(`CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      description TEXT,
      amount REAL,
      date TEXT,
      category TEXT,
      status TEXT,
      payment_method TEXT,
      notes TEXT,
      created_at TEXT,
      updated_at TEXT
    )`);
    exec(`CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)`);
    exec(`CREATE INDEX IF NOT EXISTS idx_expenses_year ON expenses((CAST(strftime('%Y', date) AS INT)))`);

    exec(`CREATE TABLE IF NOT EXISTS insights (
      id TEXT PRIMARY KEY,
      type TEXT,
      data TEXT,
      timestamp TEXT,
      year INTEGER,
      created_at TEXT,
      updated_at TEXT
    )`);
    exec(`CREATE INDEX IF NOT EXISTS idx_insights_type ON insights(type)`);
    exec(`CREATE INDEX IF NOT EXISTS idx_insights_year ON insights(year)`);
    // Transactions by year index
    exec(`CREATE INDEX IF NOT EXISTS idx_transactions_year ON transactions((CAST(strftime('%Y', date) AS INT)))`);

    exec(`CREATE TABLE IF NOT EXISTS income (
      id TEXT PRIMARY KEY,
      description TEXT,
      amount REAL,
      date TEXT,
      donor_id TEXT,
      person_id TEXT,
      category TEXT,
      type TEXT,
      is_recurring INTEGER,
      recurrence_period TEXT,
      notes TEXT,
      status TEXT,
      payment_method TEXT,
      document_number TEXT,
      created_at TEXT,
      updated_at TEXT
    )`);

    exec(`CREATE TABLE IF NOT EXISTS subscriptionStatus (
      id TEXT PRIMARY KEY,
      status TEXT,
      planName TEXT,
      interval TEXT,
      currentPeriodStart TEXT,
      currentPeriodEnd TEXT,
      cancelAtPeriodEnd INTEGER,
      stripeSubscriptionId TEXT,
      stripeCustomerId TEXT,
      lastSync TEXT,
      userId TEXT
    )`);

    exec(`CREATE TABLE IF NOT EXISTS syncMetadata (
      id TEXT PRIMARY KEY,
      year INTEGER,
      sheetId TEXT,
      lastSync TEXT,
      status TEXT,
      error TEXT
    )`);
    exec(`CREATE TABLE IF NOT EXISTS syncData (
      id TEXT PRIMARY KEY,
      year INTEGER,
      type TEXT,
      date TEXT,
      data TEXT
    )`);
  }

  private encode(v: any) { return typeof v === 'object' && v !== null ? JSON.stringify(v) : v; }
  private decode(row: Row): Row {
    const jsonFields = ['sheet_ids','subscription','tags','socialPrograms','data'];
    const out: Row = { ...row };
    for (const f of jsonFields) if (out[f] && typeof out[f] === 'string') { try { out[f] = JSON.parse(out[f]); } catch {} }
    // boolean fields stored as integers
    const boolFields = ['require_auth','google_sync_enabled','active','isWhatsApp','is_recurring','notification_dismissed','cancelAtPeriodEnd'];
    for (const b of boolFields) if (b in out) out[b] = !!out[b];
    return out;
  }

  list(table: string): Row[] {
    const rows = this.all(`SELECT * FROM ${table}`);
    return rows.map(r => this.decode(r));
  }
  getById(table: string, id: string): Row | undefined {
    const row = this.get(`SELECT * FROM ${table} WHERE id = ?`, id);
    return row ? this.decode(row) : undefined;
  }
  upsert(table: string, obj: Row) {
    const cols = Object.keys(obj);
    const placeholders = cols.map(c => `@${c}`).join(',');
    const updates = cols.filter(c => c !== 'id').map(c => `${c}=excluded.${c}`).join(',');
    const params: Row = {};
    cols.forEach(c => params[`@${c}`] = this.encode(obj[c]));
    const sql = `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders}) ON CONFLICT(id) DO UPDATE SET ${updates}`;
    this.run(sql, params);
  }
  delete(table: string, id: string) { this.run(`DELETE FROM ${table} WHERE id = ?`, id); }
  updateFields(table: string, id: string, patch: Row) {
    const cols = Object.keys(patch);
    if (cols.length === 0) return;
    const sets = cols.map(c => `${c}=@${c}`).join(',');
    const params: Row = { '@id': id };
    cols.forEach(c => params[`@${c}`] = this.encode(patch[c]));
    this.run(`UPDATE ${table} SET ${sets} WHERE id=@id`, params);
  }
}
