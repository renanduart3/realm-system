import { ReportGenerator, ReportContext, ReportResult } from './types';
import { generateTopSellingProductsReport } from './products/topSellingProducts';
import { generateABCCurveReport } from './products/abcCurve';
import { generateSalesByPeriodReport } from './sales/salesByPeriod';
import { generatePaymentMethodsReport } from './analytics/paymentMethods';
import { generatePeakHoursReport } from './analytics/peakHours';
import { generateRFVRankingReport } from './clients/rfvRanking';
import { generateInactiveClientsReport } from './clients/inactiveClients';
import { generateProfitMarginReport } from './analytics/profitMargin';

const registry: Record<string, ReportGenerator> = {
  '1': generateTopSellingProductsReport,
  '2': generateABCCurveReport,
  '3': generateSalesByPeriodReport,
  '4': generatePaymentMethodsReport,
  '5': generatePeakHoursReport,
  '6': generateRFVRankingReport,
  '7': generateInactiveClientsReport,
  '8': generateProfitMarginReport,
};

export async function generateReportById(id: string, ctx?: ReportContext): Promise<ReportResult> {
  const gen = registry[id];
  if (!gen) {
    throw new Error(`Report generator not found for id ${id}`);
  }
  return gen(ctx);
}

export function hasReport(id: string): boolean {
  return Boolean(registry[id]);
}

