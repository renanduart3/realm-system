import { getDbEngine } from '../db/engine';
import { Income, TransactionType } from '../model/types';
import { v4 as uuidv4 } from 'uuid';

export const incomeService = {
  async createIncome(data: Partial<Income>, organizationType: 'profit' | 'nonprofit'): Promise<Income> {
    if (organizationType !== 'nonprofit') {
      throw new Error('Receitas não são permitidas para organizações com fins lucrativos');
    }

    const income: Income = {
      id: uuidv4(),
      description: data.description || '',
      amount: data.amount || 0,
      date: data.date || new Date().toISOString(),
      donor_id: data.donor_id,
      person_id: data.person_id,
      category: data.category || 'other',
      type: data.type || 'other',
      is_recurring: data.is_recurring || false,
      recurrence_period: data.recurrence_period,
      status: data.status || 'pending',
      payment_method: data.payment_method,
      document_number: data.document_number,
      notes: data.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await getDbEngine().upsertIncome(income);
    return income;
  },

  async getAllIncome(): Promise<Income[]> {
    return await getDbEngine().listIncome();
  },

  async getIncomeById(id: string): Promise<Income | undefined> {
    return await getDbEngine().getIncomeById(id) as any;
  },

  async updateIncome(id: string, data: Partial<Income>): Promise<Income | undefined> {
    const income = await getDbEngine().getIncomeById(id) as any;
    if (!income) return undefined;

    const updatedIncome: Income = {
      ...income,
      ...data,
      updated_at: new Date().toISOString()
    };

    await getDbEngine().upsertIncome(updatedIncome);
    return updatedIncome;
  },

  async deleteIncome(id: string): Promise<void> {
    await getDbEngine().deleteIncome(id);
  },

  async getIncomeByType(type: TransactionType): Promise<Income[]> {
    const all = await getDbEngine().listIncome();
    return all.filter(i => i.type === type);
  },

  async getIncomeByDateRange(startDate: string, endDate: string): Promise<Income[]> {
    const all = await getDbEngine().listIncome();
    const s = new Date(startDate);
    const e = new Date(endDate);
    return all.filter(i => {
      const d = new Date(i.date);
      return d >= s && d <= e;
    });
  },

  async getRecurringIncome(): Promise<Income[]> {
    const all = await getDbEngine().listIncome();
    return all.filter(i => i.is_recurring);
  }
}; 
