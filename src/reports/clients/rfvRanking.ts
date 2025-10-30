import { getDbEngine } from '../../db/engine';
import { ReportGenerator } from '../types';

function scoreByQuantiles(values: number[], value: number): number {
  if (values.length === 0) return 1;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = sorted.findIndex((v) => v > value);
  const rank = idx === -1 ? sorted.length : idx + 1;
  const q = rank / sorted.length; // 0..1
  // Map to 1..5
  if (q <= 0.2) return 1;
  if (q <= 0.4) return 2;
  if (q <= 0.6) return 3;
  if (q <= 0.8) return 4;
  return 5;
}

export const generateRFVRankingReport: ReportGenerator = async () => {
  const clients = await (getDbEngine() as any).listClients?.() || [];
  const sales = await getDbEngine().listSales();

  // Prepare per client metrics
  const byClient = new Map<string, { name: string; lastDate?: string; freq: number; total: number }>();

  clients.forEach((c) => byClient.set(c.id, { name: c.name, freq: 0, total: 0 }));

  sales.forEach((s) => {
    if (!s.client_id) return;
    const entry = byClient.get(s.client_id) || { name: s.client_id, freq: 0, total: 0 };
    entry.freq += 1;
    entry.total += s.value || 0;
    if (!entry.lastDate || new Date(s.date) > new Date(entry.lastDate)) {
      entry.lastDate = s.date;
    }
    byClient.set(s.client_id, entry);
  });

  const today = new Date();
  const recencyDays = Array.from(byClient.values()).map((e) => {
    if (!e.lastDate) return Number.MAX_SAFE_INTEGER;
    const diff = today.getTime() - new Date(e.lastDate).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  });
  const frequencies = Array.from(byClient.values()).map((e) => e.freq);
  const values = Array.from(byClient.values()).map((e) => e.total);

  const rows = Array.from(byClient.entries()).map(([id, e]) => {
    const days = e.lastDate
      ? Math.ceil((today.getTime() - new Date(e.lastDate).getTime()) / (1000 * 60 * 60 * 24))
      : Number.MAX_SAFE_INTEGER;
    const rScore = 6 - scoreByQuantiles(recencyDays, days); // lower days -> higher score
    const fScore = scoreByQuantiles(frequencies, e.freq);
    const vScore = scoreByQuantiles(values, e.total);
    const rfv = rScore + fScore + vScore;
    return {
      client: e.name,
      lastPurchase: e.lastDate || 'Nunca',
      recencyDays: e.lastDate ? days : null,
      frequency: e.freq,
      value: Number(e.total.toFixed(2)),
      rScore,
      fScore,
      vScore,
      rfv,
    };
  });

  rows.sort((a, b) => b.rfv - a.rfv);

  return {
    id: '6',
    title: 'Ranking de Clientes (RFV)',
    columns: [
      { key: 'client', label: 'Cliente' },
      { key: 'lastPurchase', label: 'Última Compra' },
      { key: 'recencyDays', label: 'Recência (dias)' },
      { key: 'frequency', label: 'Frequência' },
      { key: 'value', label: 'Valor (R$)' },
      { key: 'rScore', label: 'R' },
      { key: 'fScore', label: 'F' },
      { key: 'vScore', label: 'V' },
      { key: 'rfv', label: 'RFV' },
    ],
    rows,
  };
};
