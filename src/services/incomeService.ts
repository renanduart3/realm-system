import { db } from '../db/AppDatabase';
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

    await db.income.add(income);
    return income;
  },

  async getAllIncome(): Promise<Income[]> {
    return await db.income.toArray();
  },

  async getIncomeById(id: string): Promise<Income | undefined> {
    return await db.income.get(id);
  },

  async updateIncome(id: string, data: Partial<Income>): Promise<Income | undefined> {
    const income = await db.income.get(id);
    if (!income) return undefined;

    const updatedIncome: Income = {
      ...income,
      ...data,
      updated_at: new Date().toISOString()
    };

    await db.income.put(updatedIncome);
    return updatedIncome;
  },

  async deleteIncome(id: string): Promise<void> {
    await db.income.delete(id);
  },

  async getIncomeByType(type: TransactionType): Promise<Income[]> {
    return await db.income.where('type').equals(type).toArray();
  },

  async getIncomeByDateRange(startDate: string, endDate: string): Promise<Income[]> {
    return await db.income
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
  },

  async getRecurringIncome(): Promise<Income[]> {
    return await db.income.where('is_recurring').equals(1).toArray();
  }
}; 