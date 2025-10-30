import { getDbEngine } from '../db/engine';

export interface TableSchemaSummary {
  name: string;
  primKey?: any;
  indexes?: any[];
}

export interface DatabaseExportDump {
  meta: {
    app: string;
    dbName: string;
    version: number;
    exportedAt: string;
  };
  schema: {
    tables: TableSchemaSummary[];
  };
  data: Record<string, any[]>;
}

function getTableSchemaSummary(table: any): TableSchemaSummary {
  // Dexie exposes table.schema with primKey and indexes; keep it permissive to avoid runtime breakage across versions.
  try {
    const schema = (table as any).schema;
    return {
      name: table.name,
      primKey: schema?.primKey ?? undefined,
      indexes: schema?.indexes ?? undefined,
    };
  } catch {
    return { name: table.name };
  }
}

export async function exportDatabase(): Promise<DatabaseExportDump> {
  const engine: any = getDbEngine();
  const data: Record<string, any[]> = {};
  const collectors: Record<string, () => Promise<any[]>> = {
    systemConfig: async () => {
      const cfg = await engine.getSystemConfig?.('system-config');
      return cfg ? [cfg] : [];
    },
    products: () => engine.listProducts?.() || Promise.resolve([]),
    clients: () => engine.listClients?.() || Promise.resolve([]),
    persons: () => engine.listPersons?.() || Promise.resolve([]),
    income: () => engine.listIncome?.() || Promise.resolve([]),
    donors: () => engine.listDonors?.() || Promise.resolve([]),
    financialCategories: () => engine.listFinancialCategories?.() || Promise.resolve([]),
    systemUsers: () => engine.listSystemUsers?.() || Promise.resolve([]),
    sales: () => engine.listSales?.() || Promise.resolve([]),
    saleItems: () => engine.listSaleItems?.() || Promise.resolve([]),
    expenses: () => engine.listExpenses?.() || Promise.resolve([]),
    transactions: () => engine.listTransactions?.() || Promise.resolve([]),
    recurringExpenses: () => engine.listRecurringExpenses?.() || Promise.resolve([]),
    insights: () => engine.listInsights?.() || Promise.resolve([]),
    subscriptionStatus: async () => {
      const s = await engine.getSubscriptionStatus?.('currentUser');
      return s ? [s] : [];
    },
  };
  for (const [name, fn] of Object.entries(collectors)) {
    try { data[name] = await fn(); } catch { data[name] = []; }
  }
  const dump: DatabaseExportDump = {
    meta: { app: 'realm-system', dbName: 'sqlite', version: 1, exportedAt: new Date().toISOString() },
    schema: { tables: Object.keys(data).map(n => ({ name: n })) },
    data,
  };
  return dump;
}

export async function importDatabase(dump: DatabaseExportDump): Promise<void> {
  if (!dump || !dump.data || !dump.meta) {
    throw new Error('Backup inválido. Estrutura ausente.');
  }

  // Basic safety: ensure it was exported from this app
  if (dump.meta.app !== 'realm-system') {
    console.warn('Importing dump from unknown source app:', dump.meta.app);
  }

  // Import strategy: clear each existing table, then bulkPut entries from dump matching table name.
  // Tables missing in dump are left untouched; tables present in dump but unknown locally are ignored.
  const tables = (db as any).tables as any[];

  for (const table of tables) {
    const rows = dump.data[table.name];
    if (!rows) continue;
    await table.clear();
    if (rows.length > 0) {
      await table.bulkPut(rows);
    }
  }
}

export function downloadJsonDump(dump: DatabaseExportDump, filename = 'realm-system-backup.json') {
  const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
