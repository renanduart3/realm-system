import { getDbEngine } from '../../db/engine';
import { RecurringExpense } from '../../model/types';
import { recurringExpenseService } from '../../services/recurringExpenseService';
import { financialCategoryService } from '../../services/financialCategoryService';

export async function migrateRecurringExpenses(): Promise<{
  success: boolean;
  migrated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let migrated = 0;

  try {
    console.log('🔄 Starting recurring expenses migration...');

    // Check if migration is needed
    const existingRecurringExpenses = (await (getDbEngine() as any).listRecurringExpenses?.() || []).length;
    if (existingRecurringExpenses > 0) {
      console.log('✅ Recurring expenses already migrated');
      return { success: true, migrated: existingRecurringExpenses, errors: [] };
    }

    // Find all transactions marked as recurring
    const recurringTransactions = await (getDbEngine() as any).listTransactions?.()
      .where('is_recurring').equals(true)
      .toArray();

    console.log(`📊 Found ${recurringTransactions.length} recurring transactions to migrate`);

    if (recurringTransactions.length === 0) {
      console.log('✅ No recurring transactions found to migrate');
      return { success: true, migrated: 0, errors: [] };
    }

    // Group by description and amount to avoid duplicates
    const uniqueRecurringExpenses = new Map<string, RecurringExpense>();

    for (const transaction of recurringTransactions) {
      try {
        const key = `${transaction.description}-${transaction.value}`;
        
        if (!uniqueRecurringExpenses.has(key)) {
          // Map legacy category to specific category
          const specificCategory = financialCategoryService.mapLegacyToSpecific(transaction.category);
          
          // Calculate day of month from due_date or use 1st as default
          let dayOfMonthDue = 1;
          if (transaction.due_date) {
            const dueDate = new Date(transaction.due_date);
            if (!isNaN(dueDate.getTime())) {
              dayOfMonthDue = dueDate.getDate();
            }
          }

          const recurringExpense: Omit<RecurringExpense, 'id' | 'created_at' | 'updated_at'> = {
            description: transaction.description || 'Untitled Recurring Expense',
            amount: transaction.value,
            dayOfMonthDue,
            category: specificCategory,
            active: true
          };

          // Create the recurring expense
          const created = await recurringExpenseService.create(recurringExpense);
          uniqueRecurringExpenses.set(key, created);
          migrated++;

          // Link the original transaction to the recurring expense
          await (getDbEngine() as any).listTransactions?.().update(transaction.id, {
            recurring_expense_id: created.id
          });

          console.log(`✅ Migrated: ${created.description} (${created.amount})`);
        } else {
          // Link to existing recurring expense
          const existing = uniqueRecurringExpenses.get(key)!;
          await (getDbEngine() as any).listTransactions?.().update(transaction.id, {
            recurring_expense_id: existing.id
          });
        }
      } catch (error) {
        const errorMsg = `Failed to migrate transaction ${transaction.id}: ${error}`;
        console.error('❌', errorMsg);
        errors.push(errorMsg);
      }
    }

    console.log(`✅ Migration completed: ${migrated} recurring expenses created, ${errors.length} errors`);

    return {
      success: errors.length === 0,
      migrated,
      errors
    };
  } catch (error) {
    const errorMsg = `Migration failed: ${error}`;
    console.error('❌', errorMsg);
    return {
      success: false,
      migrated,
      errors: [...errors, errorMsg]
    };
  }
}

export async function checkMigrationStatus(): Promise<{
  needsMigration: boolean;
  recurringTransactionsCount: number;
  recurringExpensesCount: number;
}> {
  try {
    const recurringTransactionsCount = await (getDbEngine() as any).listTransactions?.()
      .where('is_recurring').equals(true)
      .count();

    const recurringExpensesCount = ((await (getDbEngine() as any).listRecurringExpenses?.()) || []).length;

    return {
      needsMigration: recurringTransactionsCount > 0 && recurringExpensesCount === 0,
      recurringTransactionsCount,
      recurringExpensesCount
    };
  } catch (error) {
    console.error('Error checking migration status:', error);
    return {
      needsMigration: false,
      recurringTransactionsCount: 0,
      recurringExpensesCount: 0
    };
  }
}

export async function rollbackMigration(): Promise<{
  success: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    console.log('🔄 Rolling back recurring expenses migration...');

    // Remove recurring_expense_id from all transactions
    await (getDbEngine() as any).listTransactions?.().toCollection().modify(transaction => {
      delete transaction.recurring_expense_id;
    });

    // Clear recurring expenses table
    for (const re of (await (getDbEngine() as any).listRecurringExpenses?.()) || []) { await (getDbEngine() as any).deleteRecurringExpense?.(re.id); }

    console.log('✅ Migration rollback completed');
    return { success: true, errors: [] };
  } catch (error) {
    const errorMsg = `Rollback failed: ${error}`;
    console.error('❌', errorMsg);
    return { success: false, errors: [errorMsg] };
  }
}


