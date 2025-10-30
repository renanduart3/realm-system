import { getDbEngine } from '../../db/engine';
import { ReportGenerator, ReportContext } from '../types';

export const generateInactiveClientsReport: ReportGenerator = async (ctx?: ReportContext) => {
  const thresholdDays = ctx?.inactivityDays ?? 60;
  const clients = await (getDbEngine() as any).listClients?.() || [];
  const sales = await getDbEngine().listSales();

  const lastSaleMap = new Map<string, string | undefined>();

  sales.forEach((s) => {
    if (!s.client_id) return;
    const last = lastSaleMap.get(s.client_id);
    if (!last || new Date(s.date) > new Date(last)) {
      lastSaleMap.set(s.client_id, s.date);
    }
  });

  const today = new Date();

  const rows = clients
    .map((c) => {
      const last = lastSaleMap.get(c.id);
      const days = last
        ? Math.ceil((today.getTime() - new Date(last).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      return {
        client: c.name,
        lastPurchase: last || 'Nunca',
        inactivityDays: days,
      };
    })
    .filter((r) => r.inactivityDays === null || (r.inactivityDays ?? 0) >= thresholdDays)
    .sort((a, b) => {
      const av = a.inactivityDays ?? Number.MAX_SAFE_INTEGER;
      const bv = b.inactivityDays ?? Number.MAX_SAFE_INTEGER;
      return bv - av;
    });

  return {
    id: '7',
    title: 'Clientes Inativos',
    columns: [
      { key: 'client', label: 'Cliente' },
      { key: 'lastPurchase', label: 'Última Compra' },
      { key: 'inactivityDays', label: 'Dias Inativo' },
    ],
    rows,
    summary: { thresholdDays, totalInactive: rows.length },
  };
};
