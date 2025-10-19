import { db } from '../../db/AppDatabase';
import { ReportGenerator, ReportContext } from '../types';

const formatMonth = (dateStr: string) => {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  return `${y}-${m}`;
};

const formatDay = (dateStr: string) => {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const generateSalesByPeriodReport: ReportGenerator = async (ctx?: ReportContext) => {
  const granularity = ctx?.granularity || 'monthly';

  let sales = await db.sales.toArray();
  if (ctx?.startDate) {
    const sd = new Date(ctx.startDate);
    sales = sales.filter((s) => new Date(s.date) >= sd);
  }
  if (ctx?.endDate) {
    const ed = new Date(ctx.endDate);
    sales = sales.filter((s) => new Date(s.date) <= ed);
  }

  const map = new Map<string, { period: string; total: number; count: number }>();

  sales.forEach((s) => {
    const key = granularity === 'daily' ? formatDay(s.date) : formatMonth(s.date);
    const entry = map.get(key) || { period: key, total: 0, count: 0 };
    entry.total += s.value || 0;
    entry.count += 1;
    map.set(key, entry);
  });

  const rows = Array.from(map.values())
    .sort((a, b) => (a.period < b.period ? -1 : 1))
    .map((r) => ({
      period: r.period,
      salesCount: r.count,
      salesTotal: Number(r.total.toFixed(2)),
    }));

  const total = rows.reduce((sum, r) => sum + r.salesTotal, 0);

  return {
    id: '3',
    title: 'Análise de Vendas por Período',
    columns: [
      { key: 'period', label: granularity === 'daily' ? 'Dia' : 'Mês' },
      { key: 'salesCount', label: 'Qtde. de Vendas' },
      { key: 'salesTotal', label: 'Total (R$)' },
    ],
    rows,
    summary: { total: Number(total.toFixed(2)), periods: rows.length },
  };
};
