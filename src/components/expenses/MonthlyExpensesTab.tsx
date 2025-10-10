import React, { useState, useEffect } from 'react';
import { CombinedExpense } from '../../model/types';
import { expenseAggregatorService } from '../../services/expenseAggregatorService';
import { formatCurrency } from '../../utils/formatters';
import { financialCategoryService } from '../../services/financialCategoryService';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Repeat,
  CheckCircle,
  Clock,
  AlertTriangle,
  Edit,
  Trash2,
  DollarSign
} from 'lucide-react';

interface MonthlyExpensesTabProps {
  onEditExpense: (expense: CombinedExpense) => void;
  onDeleteExpense: (expense: CombinedExpense) => void;
  onPayExpense: (expense: CombinedExpense) => void;
}

export default function MonthlyExpensesTab({ 
  onEditExpense, 
  onDeleteExpense, 
  onPayExpense 
}: MonthlyExpensesTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expenses, setExpenses] = useState<CombinedExpense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadExpenses();
  }, [currentDate]);

  const loadExpenses = async () => {
    setIsLoading(true);
    try {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const monthlyExpenses = await expenseAggregatorService.getExpensesForMonth(month, year);
      setExpenses(monthlyExpenses);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading monthly expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next' | 'first' | 'last') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      switch (direction) {
        case 'prev':
          newDate.setMonth(newDate.getMonth() - 1);
          break;
        case 'next':
          newDate.setMonth(newDate.getMonth() + 1);
          break;
        case 'first':
          newDate.setMonth(0);
          break;
        case 'last':
          newDate.setMonth(11);
          break;
      }
      return newDate;
    });
  };

  const getStatusIcon = (expense: CombinedExpense) => {
    const isOverdue = new Date(expense.dueDate) < new Date() && expense.status === 'pending';
    
    if (expense.status === 'paid') {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (isOverdue) {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    } else {
      return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getExpenseTypeIcon = (expense: CombinedExpense) => {
    if (expense.type === 'virtual') {
      return <Repeat className="w-4 h-4 text-blue-500" title="Despesa Recorrente" />;
    }
    return <div className="w-2 h-2 bg-gray-500 rounded-full" title="Despesa Pontual" />;
  };

  const getCategoryIcon = (category: string) => {
    if (financialCategoryService.isLegacyCategory(category as any)) {
      return '📄';
    }
    return financialCategoryService.getCategoryIcon(category as any);
  };

  const isOverdue = (expense: CombinedExpense) => {
    return new Date(expense.dueDate) < new Date() && expense.status === 'pending';
  };

  // Pagination
  const totalPages = Math.ceil(expenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentExpenses = expenses.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth('first')}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Primeiro mês"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h2>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateMonth('last')}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Último mês"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {currentExpenses.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Nenhuma despesa encontrada para este mês
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {currentExpenses.map((expense) => (
                <div key={expense.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getExpenseTypeIcon(expense)}
                        {getStatusIcon(expense)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getCategoryIcon(expense.category)}</span>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {expense.description}
                          </h3>
                          {expense.isRecurring && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                              Recorrente
                            </span>
                          )}
                          {isOverdue(expense) && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                              Atrasado
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Vence em {new Date(expense.dueDate).toLocaleDateString('pt-BR')}
                          </p>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            financialCategoryService.getCategoryColor(expense.category)
                          }`}>
                            {financialCategoryService.getCategoryLabel(expense.category)}
                          </span>
                          {expense.interestAmount && (
                            <span className="text-xs text-orange-600 dark:text-orange-400">
                              +{formatCurrency(expense.interestAmount)} juros
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(expense.amount)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {expense.status === 'paid' ? 'Pago' : 
                           isOverdue(expense) ? 'Atrasado' : 'Pendente'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {expense.status === 'pending' && (
                          <button
                            onClick={() => onPayExpense(expense)}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Pagar"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        
                        {expense.type === 'real' && (
                          <>
                            <button
                              onClick={() => onEditExpense(expense)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteExpense(expense)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(endIndex, expenses.length)}</span> de{' '}
                    <span className="font-medium">{expenses.length}</span> despesas
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
