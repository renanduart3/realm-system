import { ExpenseCategory, SpecificExpenseCategory } from '../model/types';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = ['services', 'consume', 'others']; // Legacy
export const SPECIFIC_EXPENSE_CATEGORIES: SpecificExpenseCategory[] = [
  'rent', 'water', 'electricity', 'internet', 'phone', 'gas',
  'salary', 'supply', 'maintenance', 'marketing', 'others'
];

export const financialCategoryService = {
  getExpenseCategories(): ExpenseCategory[] {
    return EXPENSE_CATEGORIES;
  },

  getSpecificExpenseCategories(): SpecificExpenseCategory[] {
    return SPECIFIC_EXPENSE_CATEGORIES;
  },

  getCategoryLabel(category: ExpenseCategory | SpecificExpenseCategory): string {
    const legacyLabels: Record<ExpenseCategory, string> = {
      services: 'Serviços',
      consume: 'Consumo',
      others: 'Outros'
    };

    const specificLabels: Record<SpecificExpenseCategory, string> = {
      rent: 'Aluguel',
      water: 'Água',
      electricity: 'Luz',
      internet: 'Internet',
      phone: 'Telefone',
      gas: 'Gás',
      salary: 'Salários',
      supply: 'Suprimentos',
      maintenance: 'Manutenção',
      marketing: 'Marketing',
      others: 'Outros'
    };

    return specificLabels[category as SpecificExpenseCategory] || legacyLabels[category as ExpenseCategory] || 'Desconhecido';
  },

  getCategoryColor(category: ExpenseCategory | SpecificExpenseCategory): string {
    const legacyColors: Record<ExpenseCategory, string> = {
      services: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      consume: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      others: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
    };

    const specificColors: Record<SpecificExpenseCategory, string> = {
      rent: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      water: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      electricity: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      internet: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
      phone: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
      gas: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      salary: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      supply: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400',
      maintenance: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
      marketing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      others: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };

    return specificColors[category as SpecificExpenseCategory] || legacyColors[category as ExpenseCategory] || 'bg-gray-100 text-gray-800';
  },

  getCategoryIcon(category: SpecificExpenseCategory): string {
    const icons: Record<SpecificExpenseCategory, string> = {
      rent: '🏠',
      water: '💧',
      electricity: '⚡',
      internet: '🌐',
      phone: '📞',
      gas: '🔥',
      salary: '💰',
      supply: '📦',
      maintenance: '🔧',
      marketing: '📢',
      others: '📄'
    };
    return icons[category] || '📄';
  },

  isLegacyCategory(category: ExpenseCategory | SpecificExpenseCategory): boolean {
    return ['services', 'consume', 'others'].includes(category as ExpenseCategory);
  },

  mapLegacyToSpecific(legacyCategory: ExpenseCategory): SpecificExpenseCategory {
    const mapping: Record<ExpenseCategory, SpecificExpenseCategory> = {
      services: 'others',
      consume: 'supply',
      others: 'others'
    };
    return mapping[legacyCategory] || 'others';
  }
};
