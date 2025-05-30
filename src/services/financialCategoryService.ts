import { ExpenseCategory } from '../model/types';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = ['services', 'consume', 'others'];

export const financialCategoryService = {
  getExpenseCategories(): ExpenseCategory[] {
    return EXPENSE_CATEGORIES;
  },

  getCategoryLabel(category: ExpenseCategory): string {
    const labels: Record<ExpenseCategory, string> = {
      services: 'Services',
      consume: 'Consume',
      others: 'Others'
    };
    return labels[category];
  },

  getCategoryColor(category: ExpenseCategory): string {
    const colors: Record<ExpenseCategory, string> = {
      services: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      consume: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      others: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
    };
    return colors[category];
  }
};
