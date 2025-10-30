import { getDbEngine } from '../../db/engine';
import { ReportGenerator } from '../types';

export const generateABCCurveReport: ReportGenerator = async () => {
  const items = await getDbEngine().listSaleItems();
  const products = await (getDbEngine() as any).listProducts?.() || [];

  const revenueMap = new Map<string, { name: string; revenue: number }>();

  items.forEach((it) => {
    const prod = products.find((p) => p.id === it.product_service_id);
    const key = it.product_service_id;
    if (!key) return;
    const name = prod?.name ?? 'Produto desconhecido';
    const entry = revenueMap.get(key) || { name, revenue: 0 };
    entry.revenue += it.total_price || (it.quantity * it.unit_price) || 0;
    revenueMap.set(key, entry);
  });

  const entries = Array.from(revenueMap.entries()).map(([id, v]) => ({ id, ...v }));
  const total = entries.reduce((sum, e) => sum + e.revenue, 0) || 1;
  entries.sort((a, b) => b.revenue - a.revenue);

  let cumulative = 0;
  const rows = entries.map((e) => {
    const share = e.revenue / total;
    cumulative += share;
    const cls = cumulative <= 0.8 ? 'A' : cumulative <= 0.95 ? 'B' : 'C';
    return {
      product: e.name,
      revenue: Number(e.revenue.toFixed(2)),
      share: Number((share * 100).toFixed(2)),
      cumulativeShare: Number((cumulative * 100).toFixed(2)),
      class: cls,
    };
  });

  return {
    id: '2',
    title: 'Curva ABC de Produtos',
    columns: [
      { key: 'product', label: 'Produto' },
      { key: 'revenue', label: 'Receita (R$)' },
      { key: 'share', label: '% Participação' },
      { key: 'cumulativeShare', label: '% Acumulado' },
      { key: 'class', label: 'Classe' },
    ],
    rows,
    summary: { totalRevenue: Number(total.toFixed(2)) },
  };
};
