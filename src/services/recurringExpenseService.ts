import { getDbEngine } from '../db/engine';
import { RecurringExpense, VirtualExpense, SpecificExpenseCategory } from '../model/types';
import { v4 as uuidv4 } from 'uuid';

export const recurringExpenseService = {
  async create(data: Omit<RecurringExpense, 'id' | 'created_at' | 'updated_at'>): Promise<RecurringExpense> {
    try {
      const recurringExpense: RecurringExpense = {
        id: uuidv4(),
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const engine = getDbEngine();
      await engine.upsertRecurringExpense(recurringExpense);
      return recurringExpense;
    } catch (error) {
      console.error('Error creating recurring expense:', error);
      throw error;
    }
  },

  async getAll(activeOnly = true): Promise<RecurringExpense[]> {
    try {
      if (activeOnly) {
        const engine = getDbEngine(); return (await engine.listRecurringExpenses()).filter(e => e.active === true);
      }
      const engine = getDbEngine(); return engine.listRecurringExpenses();
    } catch (error) {
      console.error('Error getting recurring expenses:', error);
      return [];
    }
  },

  async getById(id: string): Promise<RecurringExpense | null> {
    try {
      const engine = getDbEngine(); return await engine.getRecurringExpenseById(id) || null;
    } catch (error) {
      console.error('Error getting recurring expense by id:', error);
      return null;
    }
  },

  async update(id: string, data: Partial<RecurringExpense>): Promise<boolean> {
    try {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      };
      
      const engine = getDbEngine(); const current = await engine.getRecurringExpenseById(id); await engine.upsertRecurringExpense({ ...(current||{id}), ...updateData });
      return true;
    } catch (error) {
      console.error('Error updating recurring expense:', error);
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const engine = getDbEngine(); await engine.deleteRecurringExpense(id);
      return true;
    } catch (error) {
      console.error('Error deleting recurring expense:', error);
      return false;
    }
  },

  async generateVirtualExpensesForMonth(month: number, year: number): Promise<VirtualExpense[]> {
    try {
      const recurringExpenses = await this.getAll(true);
      const virtualExpenses: VirtualExpense[] = [];

      for (const recurring of recurringExpenses) {
        // Calculate due date for this month/year
        const dueDate = new Date(year, month - 1, recurring.dayOfMonthDue);
        
        // Check if this expense was already paid this month
        const engine = getDbEngine(); const allTx = await engine.listTransactions(); const existingTransaction = allTx.find(transaction => transaction.recurring_expense_id === recurring.id && (()=>{ const transDate = new Date(transaction.date); return transDate.getMonth() === month - 1 && transDate.getFullYear() === year;})());

        const virtualExpense: VirtualExpense = {
          id: `${recurring.id}-${year}-${month}`,
          recurringExpenseId: recurring.id,
          description: recurring.description,
          amount: recurring.amount,
          category: recurring.category,
          dueDate: dueDate.toISOString().split('T')[0],
          month,
          year,
          isPaid: !!existingTransaction,
          transactionId: existingTransaction?.id
        };

        virtualExpenses.push(virtualExpense);
      }

      return virtualExpenses;
    } catch (error) {
      console.error('Error generating virtual expenses:', error);
      return [];
    }
  },

  async getExpensesByCategory(category: SpecificExpenseCategory): Promise<RecurringExpense[]> {
    try {
      const engine = getDbEngine(); return (await engine.listRecurringExpenses()).filter((e:any)=> e.category===category && e.active);
    } catch (error) {
      console.error('Error getting expenses by category:', error);
      return [];
    }
  },

  async toggleActive(id: string): Promise<boolean> {
    try {
      const expense = await this.getById(id);
      if (!expense) return false;

      return await this.update(id, { active: !expense.active });
    } catch (error) {
      console.error('Error toggling active status:', error);
      return false;
    }
  }
};



