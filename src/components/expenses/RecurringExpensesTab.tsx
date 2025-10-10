import React, { useState, useEffect } from 'react';
import { RecurringExpense } from '../../model/types';
import { recurringExpenseService } from '../../services/recurringExpenseService';
import { formatCurrency } from '../../utils/formatters';
import { financialCategoryService } from '../../services/financialCategoryService';
import { 
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertTriangle
} from 'lucide-react';

interface RecurringExpensesTabProps {
  onAddRecurring: () => void;
  onEditRecurring: (expense: RecurringExpense) => void;
}

export default function RecurringExpensesTab({ 
  onAddRecurring, 
  onEditRecurring 
}: RecurringExpensesTabProps) {
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, [showInactive]);

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const recurringExpenses = await recurringExpenseService.getAll(!showInactive);
      setExpenses(recurringExpenses);
    } catch (error) {
      console.error('Error loading recurring expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (expense: RecurringExpense) => {
    try {
      const success = await recurringExpenseService.toggleActive(expense.id);
      if (success) {
        loadExpenses();
      }
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  const handleDelete = async (expense: RecurringExpense) => {
    if (window.confirm(
      `Tem certeza que deseja excluir a despesa recorrente "${expense.description}"?\n\n` +
      `Esta ação irá:\n` +
      `• Remover o modelo da despesa recorrente\n` +
      `• Manter o histórico de pagamentos já registrados\n` +
      `• Não afetar despesas futuras já pagas`
    )) {
      try {
        const success = await recurringExpenseService.delete(expense.id);
        if (success) {
          loadExpenses();
        }
      } catch (error) {
        console.error('Error deleting recurring expense:', error);
      }
    }
  };

  const getCategoryIcon = (category: string) => {
    return financialCategoryService.getCategoryIcon(category as any);
  };

  const getDayOfMonthText = (day: number) => {
    if (day === 1) return '1º';
    return `${day}º`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Despesas Recorrentes
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gerencie os modelos das suas despesas fixas
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Mostrar inativas
            </span>
          </label>
          
          <button
            onClick={onAddRecurring}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Despesa Recorrente
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {expenses.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {showInactive 
                ? 'Nenhuma despesa recorrente encontrada' 
                : 'Nenhuma despesa recorrente ativa encontrada'
              }
            </p>
            <button
              onClick={onAddRecurring}
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar primeira despesa recorrente
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Despesa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Vencimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-3">
                          {getCategoryIcon(expense.category)}
                        </span>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {expense.description}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {expense.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        financialCategoryService.getCategoryColor(expense.category)
                      }`}>
                        {financialCategoryService.getCategoryLabel(expense.category)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(expense.amount)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        Todo dia {getDayOfMonthText(expense.dayOfMonthDue)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {expense.active ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            <ToggleRight className="w-3 h-3 mr-1" />
                            Ativa
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            <ToggleLeft className="w-3 h-3 mr-1" />
                            Inativa
                          </span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleToggleActive(expense)}
                          className={`p-2 rounded-lg transition-colors ${
                            expense.active
                              ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                              : 'text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                          title={expense.active ? 'Desativar' : 'Ativar'}
                        >
                          {expense.active ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                        </button>
                        
                        <button
                          onClick={() => onEditRecurring(expense)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDelete(expense)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Como funcionam as despesas recorrentes?
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-200">
              <ul className="list-disc list-inside space-y-1">
                <li>As despesas recorrentes são <strong>modelos</strong> que geram despesas virtuais a cada mês</li>
                <li>Quando você marca uma despesa virtual como "paga", ela vira uma transação real</li>
                <li>Editar o valor aqui afeta apenas as despesas futuras, não o histórico</li>
                <li>Desativar uma despesa impede que ela apareça nos próximos meses</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
