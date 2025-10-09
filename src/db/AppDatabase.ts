import Dexie, { Table } from 'dexie';
import { 
  ProductService, 
  Sale, 
  SaleItem, 
  Transaction, 
  SystemUser, 
  InvitationCode,
  Client,
  Person,
  SystemConfig,
  Income,
  Donor,
  Expense,
  BaseEntity,
  // SubscriptionStatus, // Will be replaced by CachedSubscriptionStatus
  ExpenseCategory,
  CachedSubscriptionStatus
} from '../model/types';

export interface Insight extends BaseEntity {
  id: string;
  type: InsightType;
  data: any;
  timestamp: string;
  year: number;
}

export const INSIGHT_TYPES = {
  DEMAND: 'demand_prediction',
  SENTIMENT: 'customer_sentiment',
  EXPENSE: 'expense_analysis',
  SALES: 'sales_performance',
  FIDELIZATION: 'fidelization',
  PROGRAM_IMPACT: 'program_impact', // Added
  DONOR_ENGAGEMENT: 'donor_engagement' // Added
} as const;

export type InsightType = typeof INSIGHT_TYPES[keyof typeof INSIGHT_TYPES];

interface SyncMetadata {
  id: string;
  year: number;
  sheetId: string;
  lastSync: string;
  status: 'pending' | 'syncing' | 'completed' | 'error';
  error?: string;
}

interface SyncData {
  id: string;
  year: number;
  date: string;
  data: any[];
}

export class AppDatabase extends Dexie {
  // Main tables
  systemConfig!: Table<SystemConfig>;
  products!: Table<ProductService>;
  income!: Table<Income>;
  donors!: Table<Donor>;
  persons!: Table<Person>;
  systemUsers!: Table<SystemUser>;
  sales!: Table<Sale>;
  saleItems!: Table<SaleItem>;
  expenses!: Table<Expense>;
  insights!: Table<Insight>;
  clients!: Table<Client>;
  transactions!: Table<Transaction>;
  subscriptionStatus!: Table<CachedSubscriptionStatus>;

  // Sync tables
  syncMetadata!: Table<SyncMetadata>;
  syncSales!: Table<SyncData>;
  syncIncome!: Table<SyncData>;
  syncExpenses!: Table<SyncData>;
  syncInsights!: Table<SyncData>;

  constructor() {
    super('AppDatabase');
    
    this.version(2).stores({
      // Main tables
      systemConfig: 'id',
      products: '++id',
      income: '++id',
      donors: '++id',
      persons: '++id, name, email, document',
      systemUsers: '++id',
      sales: '++id',
      saleItems: '++id, sale_id, product_service_id',
      expenses: '++id',
      insights: '++id, type, year, timestamp, [year+type]',
      clients: '++id',
      transactions: '++id, category, date, [date+category]',
      subscriptionStatus: 'id',

      // Sync tables
      syncMetadata: 'id, year, sheetId, lastSync',
      syncSales: '++id, year, date, [year+date]',
      syncIncome: '++id, year, date, [year+date]',
      syncExpenses: '++id, year, date, [year+date]',
      syncInsights: '++id, year, type, timestamp, [year+type]'
    }).upgrade(tx => {
      // Migrate existing transactions to use the new category enum
      return tx.transactions.toCollection().modify(transaction => {
        if (transaction.financial_category_id) {
          // Convert old financial_category_id to new category enum
          transaction.category = 'others';
          delete transaction.financial_category_id;
        }
      });
    });
  }
}

export const db = new AppDatabase();
