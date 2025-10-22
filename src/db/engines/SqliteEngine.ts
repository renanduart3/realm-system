// Placeholder SQLite engine for Electron/Node runtime.
// In browser, direct file access is not available; for Electron we will wire better-sqlite3/sqlite3.
import type { IDatabaseEngine, SystemConfigRecord } from '../engine';

declare global {
  interface Window {
    electronAPI?: {
      ensureDbFile?: () => Promise<void>;
      resetDbFile?: () => Promise<void>;
      readSystemConfig?: (id: string) => Promise<SystemConfigRecord | null>;
      writeSystemConfig?: (cfg: SystemConfigRecord) => Promise<void>;
      clearSystemConfig?: () => Promise<void>;
      openDb?: () => Promise<void>;
      closeDb?: () => Promise<void>;
    };
  }
}

export class SqliteEngine implements IDatabaseEngine {
  private get api() { return window.electronAPI; }

  async open(): Promise<void> { await this.api?.openDb?.(); }
  async close(): Promise<void> { await this.api?.closeDb?.(); }
  async reset(): Promise<void> { await this.api?.resetDbFile?.(); }
  async ensureDatabaseExists(): Promise<void> { await this.api?.ensureDbFile?.(); }

  async getSystemConfig(id: string): Promise<SystemConfigRecord | null> {
    if (!this.api?.readSystemConfig) throw new Error('SQLite engine not available in this runtime');
    return this.api.readSystemConfig(id);
  }
  async putSystemConfig(cfg: SystemConfigRecord): Promise<void> {
    if (!this.api?.writeSystemConfig) throw new Error('SQLite engine not available in this runtime');
    await this.api.writeSystemConfig(cfg);
  }
  async clearSystemConfig(): Promise<void> {
    if (!this.api?.clearSystemConfig) throw new Error('SQLite engine not available in this runtime');
    await this.api.clearSystemConfig();
  }

  // Products
  async listProducts(): Promise<any[]> {
    if (!this.api?.listProducts) throw new Error('SQLite product API not available');
    return this.api.listProducts();
  }
  async getProductById(id: string): Promise<any | null> {
    if (!this.api?.getProductById) throw new Error('SQLite product API not available');
    return this.api.getProductById(id);
  }
  async upsertProduct(product: any): Promise<void> {
    if (!this.api?.upsertProduct) throw new Error('SQLite product API not available');
    await this.api.upsertProduct(product);
  }
  async deleteProduct(id: string): Promise<void> {
    if (!this.api?.deleteProduct) throw new Error('SQLite product API not available');
    await this.api.deleteProduct(id);
  }

  // Clients
  async listClients(): Promise<any[]> {
    if (!this.api?.listClients) throw new Error('SQLite client API not available');
    return this.api.listClients();
  }
  async getClientById(id: string): Promise<any | null> {
    if (!this.api?.getClientById) throw new Error('SQLite client API not available');
    return this.api.getClientById(id);
  }
  async upsertClient(client: any): Promise<void> {
    if (!this.api?.upsertClient) throw new Error('SQLite client API not available');
    await this.api.upsertClient(client);
  }
  async deleteClient(id: string): Promise<void> {
    if (!this.api?.deleteClient) throw new Error('SQLite client API not available');
    await this.api.deleteClient(id);
  }

  // Transactions
  async listTransactions(): Promise<any[]> { if (!this.api?.listTransactions) throw new Error('SQLite tx API not available'); return this.api.listTransactions(); }
  async getTransactionById(id: string): Promise<any | null> { if (!this.api?.getTransactionById) throw new Error('SQLite tx API not available'); return this.api.getTransactionById(id); }
  async upsertTransaction(tx: any): Promise<void> { if (!this.api?.upsertTransaction) throw new Error('SQLite tx API not available'); await this.api.upsertTransaction(tx); }
  async updateTransactionFields(id: string, patch: Partial<any>): Promise<void> { if (!this.api?.updateTransactionFields) throw new Error('SQLite tx API not available'); await this.api.updateTransactionFields(id, patch); }
  async deleteTransaction(id: string): Promise<void> { if (!this.api?.deleteTransaction) throw new Error('SQLite tx API not available'); await this.api.deleteTransaction(id); }

  // Recurring Expenses
  async listRecurringExpenses(): Promise<any[]> { if (!this.api?.listRecurringExpenses) throw new Error('SQLite recurring API not available'); return this.api.listRecurringExpenses(); }
  async getRecurringExpenseById(id: string): Promise<any | null> { if (!this.api?.getRecurringExpenseById) throw new Error('SQLite recurring API not available'); return this.api.getRecurringExpenseById(id); }
  async upsertRecurringExpense(model: any): Promise<void> { if (!this.api?.upsertRecurringExpense) throw new Error('SQLite recurring API not available'); await this.api.upsertRecurringExpense(model); }
  async deleteRecurringExpense(id: string): Promise<void> { if (!this.api?.deleteRecurringExpense) throw new Error('SQLite recurring API not available'); await this.api.deleteRecurringExpense(id); }

  // Sales and Sale Items
  async listSales(): Promise<any[]> { if (!this.api?.listSales) throw new Error('SQLite sales API not available'); return this.api.listSales(); }
  async getSaleById(id: string): Promise<any | null> { if (!this.api?.getSaleById) throw new Error('SQLite sales API not available'); return this.api.getSaleById(id); }
  async upsertSale(sale: any): Promise<void> { if (!this.api?.upsertSale) throw new Error('SQLite sales API not available'); await this.api.upsertSale(sale); }
  async deleteSale(id: string): Promise<void> { if (!this.api?.deleteSale) throw new Error('SQLite sales API not available'); await this.api.deleteSale(id); }

  async listSaleItems(): Promise<any[]> { if (!this.api?.listSaleItems) throw new Error('SQLite saleItems API not available'); return this.api.listSaleItems(); }
  async upsertSaleItem(item: any): Promise<void> { if (!this.api?.upsertSaleItem) throw new Error('SQLite saleItems API not available'); await this.api.upsertSaleItem(item); }
  async deleteSaleItem(id: string): Promise<void> { if (!this.api?.deleteSaleItem) throw new Error('SQLite saleItems API not available'); await this.api.deleteSaleItem(id); }

  // Expenses
  async listExpenses(): Promise<any[]> { if (!this.api?.listExpenses) throw new Error('SQLite expenses API not available'); return this.api.listExpenses(); }
  async getExpenseById(id: string): Promise<any | null> { if (!this.api?.getExpenseById) throw new Error('SQLite expenses API not available'); return this.api.getExpenseById(id); }
  async upsertExpense(expense: any): Promise<void> { if (!this.api?.upsertExpense) throw new Error('SQLite expenses API not available'); await this.api.upsertExpense(expense); }
  async deleteExpense(id: string): Promise<void> { if (!this.api?.deleteExpense) throw new Error('SQLite expenses API not available'); await this.api.deleteExpense(id); }

  // Insights
  async listInsights(): Promise<any[]> { if (!this.api?.listInsights) throw new Error('SQLite insights API not available'); return this.api.listInsights(); }
  async putInsight(insight: any): Promise<void> { if (!this.api?.putInsight) throw new Error('SQLite insights API not available'); await this.api.putInsight(insight); }
  async addInsight(insight: any): Promise<void> { if (!this.api?.addInsight) throw new Error('SQLite insights API not available'); await this.api.addInsight(insight); }

  // Income
  async listIncome(): Promise<any[]> { if (!this.api?.listIncome) throw new Error('SQLite income API not available'); return this.api.listIncome(); }
  async getIncomeById(id: string): Promise<any | null> { if (!this.api?.getIncomeById) throw new Error('SQLite income API not available'); return this.api.getIncomeById(id); }
  async upsertIncome(income: any): Promise<void> { if (!this.api?.upsertIncome) throw new Error('SQLite income API not available'); await this.api.upsertIncome(income); }
  async deleteIncome(id: string): Promise<void> { if (!this.api?.deleteIncome) throw new Error('SQLite income API not available'); await this.api.deleteIncome(id); }

  // Persons
  async listPersons(): Promise<any[]> { if (!this.api?.listPersons) throw new Error('SQLite persons API not available'); return this.api.listPersons(); }
  async getPersonById(id: string): Promise<any | null> { if (!this.api?.getPersonById) throw new Error('SQLite persons API not available'); return this.api.getPersonById(id); }
  async upsertPerson(person: any): Promise<void> { if (!this.api?.upsertPerson) throw new Error('SQLite persons API not available'); await this.api.upsertPerson(person); }
  async deletePerson(id: string): Promise<void> { if (!this.api?.deletePerson) throw new Error('SQLite persons API not available'); await this.api.deletePerson(id); }

  // Donors
  async listDonors(): Promise<any[]> { if (!this.api?.listDonors) throw new Error('SQLite donors API not available'); return this.api.listDonors(); }
  async upsertDonor(donor: any): Promise<void> { if (!this.api?.upsertDonor) throw new Error('SQLite donors API not available'); await this.api.upsertDonor(donor); }
  async deleteDonor(id: string): Promise<void> { if (!this.api?.deleteDonor) throw new Error('SQLite donors API not available'); await this.api.deleteDonor(id); }

  // Financial Categories
  async listFinancialCategories(): Promise<any[]> { if (!this.api?.listFinancialCategories) throw new Error('SQLite financial categories API not available'); return this.api.listFinancialCategories(); }
  async upsertFinancialCategory(cat: any): Promise<void> { if (!this.api?.upsertFinancialCategory) throw new Error('SQLite financial categories API not available'); await this.api.upsertFinancialCategory(cat); }
  async deleteFinancialCategory(id: string): Promise<void> { if (!this.api?.deleteFinancialCategory) throw new Error('SQLite financial categories API not available'); await this.api.deleteFinancialCategory(id); }

  // System Users
  async listSystemUsers(): Promise<any[]> { if (!this.api?.listSystemUsers) throw new Error('SQLite system users API not available'); return this.api.listSystemUsers(); }
  async getSystemUserById(id: string): Promise<any | null> { if (!this.api?.getSystemUserById) throw new Error('SQLite system users API not available'); return this.api.getSystemUserById(id); }
  async upsertSystemUser(user: any): Promise<void> { if (!this.api?.upsertSystemUser) throw new Error('SQLite system users API not available'); await this.api.upsertSystemUser(user); }
  async deleteSystemUser(id: string): Promise<void> { if (!this.api?.deleteSystemUser) throw new Error('SQLite system users API not available'); await this.api.deleteSystemUser(id); }

  // Invitation Codes
  async addInvitationCode(code: any): Promise<void> { if (!this.api?.addInvitationCode) throw new Error('SQLite invitation API not available'); await this.api.addInvitationCode(code); }
  async getInvitationCodeByCode(code: string): Promise<any | null> { if (!this.api?.getInvitationCodeByCode) throw new Error('SQLite invitation API not available'); return this.api.getInvitationCodeByCode(code); }

  // Subscription Status
  async getSubscriptionStatus(id: string): Promise<any | null> { if (!this.api?.getSubscriptionStatus) throw new Error('SQLite subscription API not available'); return this.api.getSubscriptionStatus(id); }
  async putSubscriptionStatus(status: any): Promise<void> { if (!this.api?.putSubscriptionStatus) throw new Error('SQLite subscription API not available'); await this.api.putSubscriptionStatus(status); }
}
