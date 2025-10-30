import { getDbEngine } from '../../db/engine';
import { ReportGenerator } from '../types';

export const generateTopSellingProductsReport: ReportGenerator = async () => {
  // Aggregate quantities and revenue from saleItems joined with products
  const items = await getDbEngine().listSaleItems();
  const products = await (getDbEngine() as any).listProducts?.() || [];

  const map = new Map<string, { productId: string; name: string; quantity: number; revenue: number }>();

  items.forEach((it) => {
    const prod = products.find((p) => p.id === it.product_service_id);
    const key = it.product_service_id;
    if (!key) return;
    const name = prod?.name ?? 'Produto desconhecido';
    const entry = map.get(key) || { productId: key, name, quantity: 0, revenue: 0 };
    entry.quantity += it.quantity || 0;
    entry.revenue += it.total_price || (it.quantity * it.unit_price) || 0;
    map.set(key, entry);
  });

  const rows = Array.from(map.values())
    .sort((a, b) => b.quantity - a.quantity)
    .map((r) => ({
      product: r.name,
      quantity: r.quantity,
      revenue: Number(r.revenue.toFixed(2)),
    }));

  return {
    id: '1',
    title: 'Relatório de Produtos Mais Vendidos',
    columns: [
      { key: 'product', label: 'Produto' },
      { key: 'quantity', label: 'Quantidade Vendida' },
      { key: 'revenue', label: 'Receita (R$)' },
    ],
    rows,
  };
};
