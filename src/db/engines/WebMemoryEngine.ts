import type { IDatabaseEngine, SystemConfigRecord } from '../engine';

// Simple in-memory/localStorage-backed engine for web runtime (no Electron).
export class WebMemoryEngine implements IDatabaseEngine {
  private storageKey = 'system-config';

  async open(): Promise<void> {}
  async close(): Promise<void> {}
  async reset(): Promise<void> { localStorage.removeItem(this.storageKey); }
  async ensureDatabaseExists(): Promise<void> {}

  async getSystemConfig(id: string): Promise<SystemConfigRecord | null> {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.id === id) return parsed as SystemConfigRecord;
      return null;
    } catch {
      return null;
    }
  }
  async putSystemConfig(cfg: SystemConfigRecord): Promise<void> {
    localStorage.setItem(this.storageKey, JSON.stringify(cfg));
  }
  async clearSystemConfig(): Promise<void> {
    localStorage.removeItem(this.storageKey);
  }

  // The following implementations are minimal no-ops or empty lists to satisfy the interface
  async listProducts(): Promise<any[]> { return []; }
  async getProductById(_id: string): Promise<any | null> { return null; }
  async upsertProduct(_product: any): Promise<void> {}
  async deleteProduct(_id: string): Promise<void> {}

  async listClients(): Promise<any[]> { return []; }
  async getClientById(_id: string): Promise<any | null> { return null; }
  async upsertClient(_client: any): Promise<void> {}
  async deleteClient(_id: string): Promise<void> {}

  async listTransactions(): Promise<any[]> { return []; }
  async getTransactionById(_id: string): Promise<any | null> { return null; }
  async upsertTransaction(_tx: any): Promise<void> {}
  async updateTransactionFields(_id: string, _patch: Partial<any>): Promise<void> {}
  async deleteTransaction(_id: string): Promise<void> {}

  async listRecurringExpenses(): Promise<any[]> { return []; }
  async getRecurringExpenseById(_id: string): Promise<any | null> { return null; }
  async upsertRecurringExpense(_model: any): Promise<void> {}
  async deleteRecurringExpense(_id: string): Promise<void> {}

  async listSales(): Promise<any[]> { return []; }
  async getSaleById(_id: string): Promise<any | null> { return null; }
  async upsertSale(_sale: any): Promise<void> {}
  async deleteSale(_id: string): Promise<void> {}

  async listSaleItems(): Promise<any[]> { return []; }
  async upsertSaleItem(_item: any): Promise<void> {}
  async deleteSaleItem(_id: string): Promise<void> {}

  async listExpenses(): Promise<any[]> { return []; }
  async getExpenseById(_id: string): Promise<any | null> { return null; }
  async upsertExpense(_expense: any): Promise<void> {}
  async deleteExpense(_id: string): Promise<void> {}

  async listInsights(): Promise<any[]> { return []; }
  async putInsight(_insight: any): Promise<void> {}
  async addInsight(_insight: any): Promise<void> {}

  async listIncome(): Promise<any[]> { return []; }
  async getIncomeById(_id: string): Promise<any | null> { return null; }
  async upsertIncome(_income: any): Promise<void> {}
  async deleteIncome(_id: string): Promise<void> {}

  async listPersons(): Promise<any[]> { return []; }
  async getPersonById(_id: string): Promise<any | null> { return null; }
  async upsertPerson(_person: any): Promise<void> {}
  async deletePerson(_id: string): Promise<void> {}

  async listDonors(): Promise<any[]> { return []; }
  async upsertDonor(_donor: any): Promise<void> {}
  async deleteDonor(_id: string): Promise<void> {}

  async listFinancialCategories(): Promise<any[]> { return []; }
  async upsertFinancialCategory(_cat: any): Promise<void> {}
  async deleteFinancialCategory(_id: string): Promise<void> {}

  async listSystemUsers(): Promise<any[]> { return []; }
  async getSystemUserById(_id: string): Promise<any | null> { return null; }
  async upsertSystemUser(_user: any): Promise<void> {}
  async deleteSystemUser(_id: string): Promise<void> {}

  async addInvitationCode(_code: any): Promise<void> {}
  async getInvitationCodeByCode(_code: string): Promise<any | null> { return null; }

  async getSubscriptionStatus(_id: string): Promise<any | null> { return null; }
  async putSubscriptionStatus(_status: any): Promise<void> {}
}

