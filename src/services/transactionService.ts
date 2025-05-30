import { db } from '../db/AppDatabase';
import { Transaction, ExpenseCategory } from '../model/types';
import { v4 as uuidv4 } from 'uuid';

type TransactionStatus = 'pending' | 'paid' | 'cancelled';

export const transactionService = {
  async createTransaction(
    category: ExpenseCategory,
    value: number,
    date: string,
    time: string,
    description?: string,
    client_id?: string,
    person_id?: string,
    is_recurring?: boolean,
    due_date?: string
  ): Promise<Transaction | null> {
    try {
      const newTransaction: Transaction = {
        id: uuidv4(),
        category,
        value,
        date,
        time,
        description,
        client_id,
        person_id,
        is_recurring,
        due_date,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await db.transactions.add(newTransaction);
      return newTransaction;
    } catch (error) {
      console.error("Error creating new transaction", error);
      return null;
    }
  },

  async createPaymentTransaction(
    originalTransactionId: string,
    amount: number,
    interest?: number
  ): Promise<Transaction | null> {
    try {
      const originalTransaction = await this.getTransactionById(originalTransactionId);
      if (!originalTransaction) {
        throw new Error("Original transaction not found");
      }

      const paymentTransaction: Transaction = {
        id: uuidv4(),
        category: originalTransaction.category,
        value: amount,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toISOString().split('T')[1].split('.')[0],
        related_transaction_id: originalTransactionId,
        interest_amount: interest,
        client_id: originalTransaction.client_id,
        person_id: originalTransaction.person_id,
        status: 'paid',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await db.transactions.add(paymentTransaction);

      // Update original transaction status if fully paid
      const relatedPayments = await this.getRelatedPayments(originalTransactionId);
      const totalPaid = relatedPayments.reduce((sum, payment) => sum + payment.value, 0) + amount;
      
      if (totalPaid >= originalTransaction.value) {
        await this.updateTransactionStatus(originalTransactionId, 'paid');
      }

      return paymentTransaction;
    } catch (error) {
      console.error("Error creating payment transaction", error);
      return null;
    }
  },

  async getTransactionById(id: string): Promise<Transaction | null> {
    try {
      const transaction = await db.transactions.get(id);
      return transaction || null;
    } catch (error) {
      console.error("Error getting transaction", error);
      return null;
    }
  },

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      const transactions = await db.transactions.toArray();
      return transactions;
    } catch (error) {
      console.error("Error getting all transactions", error);
      return [];
    }
  },

  async getTransactionsByMonth(month: number, year: number): Promise<Transaction[]> {
    try {
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      // Get all transactions
      const allTransactions = await db.transactions.toArray();
      
      // Filter transactions for the specified month
      const transactions = allTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        
        // Regular transactions for this month
        if (transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate)) {
          return true;
        }
        
        // Recurring transactions from previous months
        if (transaction.is_recurring) {
          const originalDate = new Date(transaction.date);
          const currentDate = new Date(year, month - 1, originalDate.getDate());
          
          // Only include if the original transaction was created before or during this month
          return originalDate <= currentDate;
        }
        
        return false;
      }).map(transaction => {
        // If it's a recurring transaction from a previous month,
        // create a new instance for this month
        if (transaction.is_recurring) {
          const originalDate = new Date(transaction.date);
          const newDate = new Date(year, month - 1, originalDate.getDate());
          
          // Only modify if it's from a previous month
          if (newDate > new Date(transaction.date)) {
            const newTransaction: Transaction = {
              ...transaction,
              id: uuidv4(), // New ID for the recurring instance
              date: newDate.toISOString().split('T')[0],
              status: 'pending' as TransactionStatus, // Explicitly type the status
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            return newTransaction;
          }
        }
        
        return transaction;
      });

      return transactions;
    } catch (error) {
      console.error("Error getting transactions by month", error);
      return [];
    }
  },

  async getTransactionsByCategory(category: ExpenseCategory): Promise<Transaction[]> {
    try {
      const transactions = await db.transactions
        .where('category')
        .equals(category)
        .toArray();

      return transactions;
    } catch (error) {
      console.error("Error getting transactions by category", error);
      return [];
    }
  },

  async getRelatedPayments(originalTransactionId: string): Promise<Transaction[]> {
    try {
      const payments = await db.transactions
        .where('related_transaction_id')
        .equals(originalTransactionId)
        .toArray();

      return payments;
    } catch (error) {
      console.error("Error getting related payments", error);
      return [];
    }
  },

  async updateTransactionStatus(id: string, status: TransactionStatus): Promise<boolean> {
    try {
      const transaction = await this.getTransactionById(id);
      if (!transaction) {
        return false;
      }

      const updatedTransaction = {
        ...transaction,
        status,
        updated_at: new Date().toISOString()
      };

      await db.transactions.put(updatedTransaction);
      return true;
    } catch (error) {
      console.error("Error updating transaction status", error);
      return false;
    }
  },

  async dismissNotification(id: string): Promise<boolean> {
    try {
      const transaction = await this.getTransactionById(id);
      if (!transaction) {
        return false;
      }

      const updatedTransaction = {
        ...transaction,
        notification_dismissed: true,
        updated_at: new Date().toISOString()
      };

      await db.transactions.put(updatedTransaction);
      return true;
    } catch (error) {
      console.error("Error dismissing notification", error);
      return false;
    }
  },

  async getTransactionsForNotification(): Promise<Transaction[]> {
    try {
      const now = new Date();
      const fourDaysFromNow = new Date(now);
      fourDaysFromNow.setDate(now.getDate() + 4);

      const transactions = await db.transactions.toArray();
      
      return transactions.filter(transaction => {
        // Skip if already paid, cancelled, or notification dismissed
        if (transaction.status !== 'pending' || transaction.notification_dismissed) {
          return false;
        }

        // Include if it's a client transaction with due date in next 4 days
        if (transaction.client_id && transaction.due_date) {
          const dueDate = new Date(transaction.due_date);
          return dueDate >= now && dueDate <= fourDaysFromNow;
        }

        // Include if it's a recurring transaction for current month
        if (transaction.is_recurring) {
          const transactionDate = new Date(transaction.date);
          return (
            transactionDate.getMonth() === now.getMonth() &&
            transactionDate.getFullYear() === now.getFullYear()
          );
        }

        return false;
      });
    } catch (error) {
      console.error("Error getting transactions for notification", error);
      return [];
    }
  },

  async editTransaction(transaction: Transaction): Promise<Transaction | null> {
    try {
      const updatedTransaction = {
        ...transaction,
        updated_at: new Date().toISOString()
      };
      
      await db.transactions.put(updatedTransaction);
      return updatedTransaction;
    } catch (error) {
      console.error("Error editing transaction", error);
      return null;
    }
  },

  async deleteTransaction(id: string): Promise<boolean> {
    try {
      await db.transactions.delete(id);
      return true;
    } catch (error) {
      console.error("Error deleting transaction", error);
      return false;
    }
  }
};
