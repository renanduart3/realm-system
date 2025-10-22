import { appConfig } from '../config/app.config';
import { SqliteEngine } from './engines/SqliteEngine';
import { WebMemoryEngine } from './engines/WebMemoryEngine';

export type DBEngineName = 'indexeddb' | 'sqlite';

export interface SystemConfigRecord {
  id: string;
  organization_type: 'profit' | 'nonprofit';
  organization_name: string;
  currency: string;
  theme: 'light' | 'dark';
  require_auth: boolean;
  google_sync_enabled: boolean;
  sheet_ids?: { [key: number]: string };
  is_configured: boolean;
  configured_at?: string;
  subscription?: any;
  created_at: string;
  updated_at: string;
}

export interface IDatabaseEngine {
  open(): Promise<void>;
  close(): Promise<void>;
  reset(): Promise<void>;
  ensureDatabaseExists(): Promise<void>;

  // Minimal ops used by systemConfigService
  getSystemConfig(id: string): Promise<SystemConfigRecord | null>;
  putSystemConfig(cfg: SystemConfigRecord): Promise<void>;
  clearSystemConfig(): Promise<void>;

  // Products
  listProducts(): Promise<any[]>;
  getProductById(id: string): Promise<any | null>;
  upsertProduct(product: any): Promise<void>;
  deleteProduct(id: string): Promise<void>;

  // Clients
  listClients(): Promise<any[]>;
  getClientById(id: string): Promise<any | null>;
  upsertClient(client: any): Promise<void>;
  deleteClient(id: string): Promise<void>;

  // Transactions
  listTransactions(): Promise<any[]>;
  getTransactionById(id: string): Promise<any | null>;
  upsertTransaction(tx: any): Promise<void>;
  updateTransactionFields(id: string, patch: Partial<any>): Promise<void>;
  deleteTransaction(id: string): Promise<void>;

  // Recurring Expenses
  listRecurringExpenses(): Promise<any[]>;
  getRecurringExpenseById(id: string): Promise<any | null>;
  upsertRecurringExpense(model: any): Promise<void>;
  deleteRecurringExpense(id: string): Promise<void>;

  // Sales and Sale Items
  listSales(): Promise<any[]>;
  getSaleById(id: string): Promise<any | null>;
  upsertSale(sale: any): Promise<void>;
  deleteSale(id: string): Promise<void>;

  listSaleItems(): Promise<any[]>;
  upsertSaleItem(item: any): Promise<void>;
  deleteSaleItem(id: string): Promise<void>;

  // Expenses (if used separately from transactions)
  listExpenses(): Promise<any[]>;
  getExpenseById(id: string): Promise<any | null>;
  upsertExpense(expense: any): Promise<void>;
  deleteExpense(id: string): Promise<void>;

  // Insights
  listInsights(): Promise<any[]>;
  putInsight(insight: any): Promise<void>;
  addInsight(insight: any): Promise<void>;

  // Income
  listIncome(): Promise<any[]>;
  getIncomeById(id: string): Promise<any | null>;
  upsertIncome(income: any): Promise<void>;
  deleteIncome(id: string): Promise<void>;

  // Persons
  listPersons(): Promise<any[]>;
  getPersonById(id: string): Promise<any | null>;
  upsertPerson(person: any): Promise<void>;
  deletePerson(id: string): Promise<void>;

  // Donors
  listDonors(): Promise<any[]>;
  upsertDonor(donor: any): Promise<void>;
  deleteDonor(id: string): Promise<void>;

  // Financial Categories
  listFinancialCategories(): Promise<any[]>;
  upsertFinancialCategory(cat: any): Promise<void>;
  deleteFinancialCategory(id: string): Promise<void>;

  // System Users
  listSystemUsers(): Promise<any[]>;
  getSystemUserById(id: string): Promise<any | null>;
  upsertSystemUser(user: any): Promise<void>;
  deleteSystemUser(id: string): Promise<void>;

  // Invitation Codes
  addInvitationCode(code: any): Promise<void>;
  getInvitationCodeByCode(code: string): Promise<any | null>;

  // Subscription Status (cached)
  getSubscriptionStatus(id: string): Promise<any | null>;
  putSubscriptionStatus(status: any): Promise<void>;
}

let engineSingleton: IDatabaseEngine | null = null;

export function getDbEngine(): IDatabaseEngine {
  if (engineSingleton) return engineSingleton;
  const isWeb = typeof window !== 'undefined';
  const hasElectron = isWeb && (window as any).electronAPI;
  if (isWeb && !hasElectron) {
    engineSingleton = new WebMemoryEngine();
  } else {
    engineSingleton = new SqliteEngine();
  }
  return engineSingleton;
}
