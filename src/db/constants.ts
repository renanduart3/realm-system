import { BaseEntity } from '../model/types';

export const INSIGHT_TYPES = {
  DEMAND: 'demand_prediction',
  SENTIMENT: 'customer_sentiment',
  EXPENSE: 'expense_analysis',
  SALES: 'sales_performance',
  FIDELIZATION: 'fidelization',
  PROGRAM_IMPACT: 'program_impact',
  DONOR_ENGAGEMENT: 'donor_engagement'
} as const;

export type InsightType = typeof INSIGHT_TYPES[keyof typeof INSIGHT_TYPES];

export interface InsightModel extends BaseEntity {
  id: string;
  type: InsightType;
  data: any;
  timestamp: string;
  year: number;
}

