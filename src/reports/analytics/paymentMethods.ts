import { db } from '../../db/AppDatabase';
import { ReportGenerator } from '../types';

// Nota: Atualmente, o modelo não armazena método de pagamento em vendas.
// Usamos Income.payment_method quando disponível como proxy simples.
export const generatePaymentMethodsReport: ReportGenerator = async () => {
  const incomes = await db.income.toArray();

  const map = new Map<string, { method: string; count: number; amount: number }>();

  incomes.forEach((i) => {
    const method = (i.payment_method || 'Desconhecido').toString();
    const entry = map.get(method) || { method, count: 0, amount: 0 };
    entry.count += 1;
    entry.amount += i.amount || 0;
    map.set(method, entry);
  });

  const total = Array.from(map.values()).reduce((sum, e) => sum + e.amount, 0) || 1;

  const rows = Array.from(map.values())
    .sort((a, b) => b.amount - a.amount)
    .map((r) => ({
      method: r.method,
      transactions: r.count,
      amount: Number(r.amount.toFixed(2)),
      share: Number(((r.amount / total) * 100).toFixed(2)),
    }));

  return {
    id: '4',
    title: 'Performance de Meios de Pagamento',
    columns: [
      { key: 'method', label: 'Meio de Pagamento' },
      { key: 'transactions', label: 'Transações' },
      { key: 'amount', label: 'Total (R$)' },
      { key: 'share', label: '% Participação' },
    ],
    rows,
    summary: { totalAmount: Number((total === 1 && rows.length === 0 ? 0 : total).toFixed(2)) },
  };
};

