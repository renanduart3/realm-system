import Dexie, { Table } from 'dexie';
import { 
  ProductService, 
  Sale, 
  SaleItem, 
  Transaction, 
  SystemUser, 
  Client,
  Person,
  SystemConfig,
  Income,
  Donor,
  Expense,
  BaseEntity,
  RecurringExpense
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
  recurringExpenses!: Table<RecurringExpense>;

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

      // Sync tables
      syncMetadata: 'id, year, sheetId, lastSync',
      syncSales: '++id, year, date, [year+date]',
      syncIncome: '++id, year, date, [year+date]',
      syncExpenses: '++id, year, date, [year+date]',
      syncInsights: '++id, year, type, timestamp, [year+type]'
    }).upgrade(tx => {
      // Migrate existing transactions to use the new category enum
      return tx.table('transactions').toCollection().modify((transaction: any) => {
        if (transaction.financial_category_id) {
          // Convert old financial_category_id to new category enum
          transaction.category = 'others';
          delete transaction.financial_category_id;
        }
      });
    });

    this.version(3).stores({
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
      transactions: '++id, category, date, [date+category], recurring_expense_id, is_recurring',
      recurringExpenses: '++id, category, active, dayOfMonthDue',

      // Sync tables
      syncMetadata: 'id, year, sheetId, lastSync',
      syncSales: '++id, year, date, [year+date]',
      syncIncome: '++id, year, date, [year+date]',
      syncExpenses: '++id, year, date, [year+date]',
      syncInsights: '++id, year, type, timestamp, [year+type]'
    }).upgrade(async tx => {
      try {
        // Migrate recurring transactions to recurringExpenses
        const recurringTransactions = await tx.table('transactions')
          .where('is_recurring').equals(1).toArray();
        
        console.log(`🔄 Found ${recurringTransactions.length} recurring transactions to migrate`);
        
        for (const trans of recurringTransactions) {
          try {
            // Create recurring expense model
            const recurringExpense: RecurringExpense = {
              id: `recurring-${trans.id}`,
              description: trans.description || 'Untitled Recurring Expense',
              amount: trans.value,
              dayOfMonthDue: trans.due_date ? new Date(trans.due_date).getDate() : 1,
              category: 'others', // Default category, user can change later
              active: true,
              created_at: trans.created_at,
              updated_at: trans.updated_at
            };
            
            await tx.table('recurringExpenses').add(recurringExpense);
            
            // Link transaction to recurring expense
            await tx.table('transactions').update(trans.id, {
              recurring_expense_id: recurringExpense.id
            });
            
            console.log(`✅ Migrated: ${recurringExpense.description}`);
          } catch (error) {
            console.error(`❌ Error migrating transaction ${trans.id}:`, error);
          }
        }
        
        console.log('✅ Migration completed successfully');
      } catch (error) {
        console.error('❌ Migration error:', error);
        // Don't throw the error to prevent app crash
      }
    });
  }
}

export const db = new AppDatabase();
