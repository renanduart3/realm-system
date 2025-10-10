import { db } from '../db/AppDatabase';
import { CombinedExpense, VirtualExpense, Transaction, RecurringExpense } from '../model/types';
import { recurringExpenseService } from './recurringExpenseService';
import { transactionService } from './transactionService';
import { v4 as uuidv4 } from 'uuid';

export const expenseAggregatorService = {
  async getExpensesForMonth(month: number, year: number): Promise<CombinedExpense[]> {
    try {
      // Get real transactions for the month
      const realTransactions = await transactionService.getTransactionsByMonth(month, year);
      
      // Get virtual expenses for the month
      const virtualExpenses = await recurringExpenseService.generateVirtualExpensesForMonth(month, year);
      
      // Convert real transactions to CombinedExpense
      const realCombined: CombinedExpense[] = realTransactions.map(trans => ({
        id: trans.id,
        type: 'real' as const,
        description: trans.description || 'Untitled Expense',
        amount: trans.value,
        category: trans.category,
        dueDate: trans.due_date || trans.date,
        status: trans.status,
        isRecurring: !!trans.recurring_expense_id,
        recurringExpenseId: trans.recurring_expense_id,
        transactionId: trans.id,
        interestAmount: trans.interest_amount,
        createdAt: trans.created_at
      }));

      // Convert virtual expenses to CombinedExpense
      const virtualCombined: CombinedExpense[] = virtualExpenses.map(virtual => ({
        id: virtual.id,
        type: 'virtual' as const,
        description: virtual.description,
        amount: virtual.amount,
        category: virtual.category,
        dueDate: virtual.dueDate,
        status: virtual.isPaid ? 'paid' : 'pending',
        isRecurring: true,
        recurringExpenseId: virtual.recurringExpenseId,
        transactionId: virtual.transactionId
      }));

      // Combine and sort by due date
      const combined = [...realCombined, ...virtualCombined];
      return combined.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    } catch (error) {
      console.error('Error getting expenses for month:', error);
      return [];
    }
  },

  async getUpcomingExpenses(days = 7): Promise<CombinedExpense[]> {
    try {
      const today = new Date();
      const endDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
      
      const allExpenses: CombinedExpense[] = [];
      
      // Check current month and next month for upcoming expenses
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
      
      // Get expenses for current month
      const currentMonthExpenses = await this.getExpensesForMonth(currentMonth, currentYear);
      allExpenses.push(...currentMonthExpenses);
      
      // Get expenses for next month
      const nextMonthExpenses = await this.getExpensesForMonth(nextMonth, nextYear);
      allExpenses.push(...nextMonthExpenses);
      
      // Filter upcoming expenses
      return allExpenses.filter(expense => {
        const dueDate = new Date(expense.dueDate);
        return dueDate >= today && dueDate <= endDate && expense.status === 'pending';
      });
    } catch (error) {
      console.error('Error getting upcoming expenses:', error);
      return [];
    }
  },

  async getOverdueExpenses(): Promise<CombinedExpense[]> {
    try {
      const today = new Date();
      const allExpenses: CombinedExpense[] = [];
      
      // Check current month and previous months for overdue expenses
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      
      // Get expenses for current month
      const currentMonthExpenses = await this.getExpensesForMonth(currentMonth, currentYear);
      allExpenses.push(...currentMonthExpenses);
      
      // Get expenses for previous month
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      const prevMonthExpenses = await this.getExpensesForMonth(prevMonth, prevYear);
      allExpenses.push(...prevMonthExpenses);
      
      // Filter overdue expenses
      return allExpenses.filter(expense => {
        const dueDate = new Date(expense.dueDate);
        return dueDate < today && expense.status === 'pending';
      });
    } catch (error) {
      console.error('Error getting overdue expenses:', error);
      return [];
    }
  },

  async markVirtualAsPaid(
    recurringExpenseId: string, 
    month: number, 
    year: number, 
    amount: number, 
    interest?: number
  ): Promise<Transaction | null> {
    try {
      const recurringExpense = await recurringExpenseService.getById(recurringExpenseId);
      if (!recurringExpense) {
        throw new Error('Recurring expense not found');
      }

      // Calculate due date for this month
      const dueDate = new Date(year, month - 1, recurringExpense.dayOfMonthDue);
      
      // Create transaction for this payment
      const transaction = await transactionService.createTransaction(
        'others', // Legacy category, will be mapped
        amount,
        dueDate.toISOString().split('T')[0],
        new Date().toTimeString().split(' ')[0],
        recurringExpense.description,
        undefined,
        undefined,
        true, // is_recurring
        dueDate.toISOString().split('T')[0]
      );

      if (transaction) {
        // Link to recurring expense
        await db.transactions.update(transaction.id, {
          recurring_expense_id: recurringExpenseId,
          interest_amount: interest
        });
      }

      return transaction;
    } catch (error) {
      console.error('Error marking virtual expense as paid:', error);
      return null;
    }
  },

  async getMonthlySummary(month: number, year: number): Promise<{
    totalPending: number;
    totalPaid: number;
    totalOverdue: number;
    countPending: number;
    countPaid: number;
    countOverdue: number;
  }> {
    try {
      const expenses = await this.getExpensesForMonth(month, year);
      const today = new Date();
      
      let totalPending = 0;
      let totalPaid = 0;
      let totalOverdue = 0;
      let countPending = 0;
      let countPaid = 0;
      let countOverdue = 0;

      expenses.forEach(expense => {
        const dueDate = new Date(expense.dueDate);
        const isOverdue = dueDate < today && expense.status === 'pending';
        
        if (expense.status === 'paid') {
          totalPaid += expense.amount + (expense.interestAmount || 0);
          countPaid++;
        } else if (isOverdue) {
          totalOverdue += expense.amount;
          countOverdue++;
        } else {
          totalPending += expense.amount;
          countPending++;
        }
      });

      return {
        totalPending,
        totalPaid,
        totalOverdue,
        countPending,
        countPaid,
        countOverdue
      };
    } catch (error) {
      console.error('Error getting monthly summary:', error);
      return {
        totalPending: 0,
        totalPaid: 0,
        totalOverdue: 0,
        countPending: 0,
        countPaid: 0,
        countOverdue: 0
      };
    }
  }
};
