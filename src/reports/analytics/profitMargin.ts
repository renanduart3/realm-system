import { db } from '../../db/AppDatabase';
import { ReportGenerator } from '../types';

// Observação: Sem custo de produto no modelo atual, usamos uma margem estimada.
const MARGIN_RATE = 0.3; // 30% estimado

export const generateProfitMarginReport: ReportGenerator = async () => {
  const items = await db.saleItems.toArray();
  const products = await db.products.toArray();

  const map = new Map<string, { name: string; revenue: number; estMargin: number }>();

  items.forEach((it) => {
    const prod = products.find((p) => p.id === it.product_service_id);
    const key = it.product_service_id;
    if (!key) return;
    const name = prod?.name ?? 'Produto desconhecido';
    const revenue = it.total_price || (it.quantity * it.unit_price) || 0;
    const entry = map.get(key) || { name, revenue: 0, estMargin: 0 };
    entry.revenue += revenue;
    entry.estMargin += revenue * MARGIN_RATE;
    map.set(key, entry);
  });

  const rows = Array.from(map.values())
    .sort((a, b) => b.estMargin - a.estMargin)
    .map((r) => ({
      product: r.name,
      revenue: Number(r.revenue.toFixed(2)),
      estimatedMargin: Number(r.estMargin.toFixed(2)),
      estimatedMarginPct: Number(((r.estMargin / (r.revenue || 1)) * 100).toFixed(2)),
    }));

  const totals = rows.reduce(
    (acc, r) => ({
      revenue: acc.revenue + r.revenue,
      margin: acc.margin + r.estimatedMargin,
    }),
    { revenue: 0, margin: 0 }
  );

  return {
    id: '8',
    title: 'Análise de Margem de Lucro',
    columns: [
      { key: 'product', label: 'Produto' },
      { key: 'revenue', label: 'Receita (R$)' },
      { key: 'estimatedMargin', label: 'Margem Estimada (R$)' },
      { key: 'estimatedMarginPct', label: 'Margem Estimada (%)' },
    ],
    rows,
    summary: {
      totalRevenue: Number(totals.revenue.toFixed(2)),
      totalEstimatedMargin: Number(totals.margin.toFixed(2)),
    },
  };
};

