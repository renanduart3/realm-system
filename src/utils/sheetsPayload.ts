import { exportDatabase } from './dbBackup';

export interface SheetPayload {
  title: string;
  headers: string[];
  rows: (string | number | boolean | null)[][];
}

export interface SheetsPayload {
  sheets: SheetPayload[];
}

export async function buildSheetsPayload(): Promise<SheetsPayload> {
  const dump = await exportDatabase();
  const sheets: SheetPayload[] = [];

  for (const [tableName, rows] of Object.entries(dump.data)) {
    const headerSet = new Set<string>();
    for (const r of rows) Object.keys(r || {}).forEach(k => headerSet.add(k));
    const headers = Array.from(headerSet);
    const values = rows.map(r => headers.map(h => {
      const v = (r as any)?.[h];
      if (v === undefined) return null;
      if (typeof v === 'object' && v !== null) return JSON.stringify(v);
      return v as any;
    }));
    sheets.push({ title: tableName, headers, rows: values });
  }

  return { sheets };
}

