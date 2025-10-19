import { db } from '../../db/AppDatabase';
import { ReportGenerator } from '../types';

export const generatePeakHoursReport: ReportGenerator = async () => {
  const sales = await db.sales.toArray();

  const map = new Map<string, { hour: string; count: number; total: number }>();

  sales.forEach((s) => {
    const hour = (s.time || '00:00').split(':')[0];
    const label = `${hour.padStart(2, '0')}:00`;
    const entry = map.get(label) || { hour: label, count: 0, total: 0 };
    entry.count += 1;
    entry.total += s.value || 0;
    map.set(label, entry);
  });

  const rows = Array.from(map.values())
    .sort((a, b) => a.hour.localeCompare(b.hour))
    .map((r) => ({
      hour: r.hour,
      salesCount: r.count,
      salesTotal: Number(r.total.toFixed(2)),
    }));

  const peak = rows.reduce((max, r) => (r.salesCount > max.salesCount ? r : max), { hour: '00:00', salesCount: 0, salesTotal: 0 });

  return {
    id: '5',
    title: 'Horários de Pico de Vendas',
    columns: [
      { key: 'hour', label: 'Hora' },
      { key: 'salesCount', label: 'Qtde. de Vendas' },
      { key: 'salesTotal', label: 'Total (R$)' },
    ],
    rows,
    summary: { peakHour: peak.hour, peakCount: peak.salesCount },
  };
};

