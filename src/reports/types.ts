import { PremiumReport } from '../model/types';

export type ReportId = PremiumReport['id'];

export interface ReportColumn {
  key: string;
  label: string;
}

export interface ReportResult {
  id: ReportId;
  title: string;
  columns: ReportColumn[];
  rows: Record<string, any>[];
  summary?: Record<string, any>;
}

export interface ReportContext {
  // Simple filter placeholders for future evolution
  startDate?: string;
  endDate?: string;
  granularity?: 'daily' | 'monthly';
  inactivityDays?: number; // used by inactive clients
}

export type ReportGenerator = (ctx?: ReportContext) => Promise<ReportResult>;

