import React, { useState, useEffect } from 'react';
import { Transaction, ExpenseCategory } from '../model/types';
import { transactionService } from '../services/transactionService';
import { financialCategoryService } from '../services/financialCategoryService';
import { formatCurrency } from '../utils/formatters';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckCircle } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import PaymentModal from './PaymentModal';

export default function MonthlyExpensesList() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all');
  const [selectedExpense, setSelectedExpense] = useState<Transaction | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { showToast } = useToast();

  useEffect(() => {
    loadExpenses();
  }, [currentDate]);

  const loadExpenses = async () => {
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    
    // Buscar despesas do mês atual
    const monthlyExpenses = await transactionService.getTransactionsByMonth(month, year);
    
    // Buscar despesas pendentes de outros meses para permitir marcar como pagas
    const allTransactions = await transactionService.getAllTransactions();
    const pendingExpensesFromOtherMonths = allTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const currentMonthDate = new Date(year, month - 1);
      
      return transaction.status === 'pending' && 
             (transactionDate.getMonth() !== currentMonthDate.getMonth() || 
              transactionDate.getFullYear() !== currentMonthDate.getFullYear());
    });
    
    // Combinar despesas do mês atual com despesas pendentes de outros meses
    const combinedExpenses = [...monthlyExpenses, ...pendingExpensesFromOtherMonths];
    
    // Remover duplicatas baseado no ID
    const uniqueExpenses = combinedExpenses.filter((expense, index, self) => 
      index === self.findIndex(e => e.id === expense.id)
    );
    
    setExpenses(uniqueExpenses);
    setCurrentPage(1); // Reset to first page when loading new data
  };

  const handlePaymentToggle = async (transaction: Transaction) => {
    const newStatus = transaction.status === 'paid' ? 'pending' : 'paid';
    const success = await transactionService.updateTransactionStatus(transaction.id, newStatus);
    if (success) {
      loadExpenses();
      showToast(`Expense marked as ${newStatus}`, 'success');
    } else {
      showToast('Failed to update expense status', 'error');
    }
  };

  const handlePaymentSubmit = async (amount: number, interest?: number) => {
    if (!selectedExpense) return;

    try {
      const result = await transactionService.createPaymentTransaction(
        selectedExpense.id,
        amount,
        interest
      );

      if (result) {
        showToast('Payment recorded successfully', 'success');
        loadExpenses();
      } else {
        throw new Error('Failed to record payment');
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to record payment',
        'error'
      );
    } finally {
      setIsPaymentModalOpen(false);
      setSelectedExpense(null);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const filteredExpenses = selectedCategory === 'all'
    ? expenses
    : expenses.filter(expense => expense.category === selectedCategory);

  // Pagination calculations
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentExpenses = filteredExpenses.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.value, 0);
  const paidAmount = filteredExpenses
    .filter(expense => expense.status === 'paid')
    .reduce((sum, expense) => sum + expense.value, 0);
  const pendingAmount = filteredExpenses
    .filter(expense => expense.status === 'pending')
    .reduce((sum, expense) => sum + expense.value, 0);

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronLeft size={20} />
        </button>
        
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Category Filter */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              selectedCategory === 'all'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            All
          </button>
          {Object.values(financialCategoryService.getExpenseCategories()).map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedCategory === category
                  ? financialCategoryService.getCategoryColor(category)
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {financialCategoryService.getCategoryLabel(category)}
            </button>
          ))}
        </div>
      </div>

      {/* Amount Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Amount */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>

        {/* Paid Amount */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Paid</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(paidAmount)}
            </p>
          </div>
        </div>

        {/* Pending Amount */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">To Pay</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(pendingAmount)}
            </p>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="space-y-4">
        {currentExpenses.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Nenhuma despesa encontrada para este período
          </p>
        ) : (
          <>
            {currentExpenses.map(expense => {
              const expenseDate = new Date(expense.date);
              const currentMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth());
              const isFromOtherMonth = expenseDate.getMonth() !== currentMonthDate.getMonth() || 
                                     expenseDate.getFullYear() !== currentMonthDate.getFullYear();
              
              return (
                <div
                  key={expense.id}
                  className={`p-4 border rounded-lg ${
                    isFromOtherMonth 
                      ? 'border-orange-200 bg-orange-50 dark:border-orange-700 dark:bg-orange-900/20' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {expense.description || 'Untitled Expense'}
                    </h3>
                    {isFromOtherMonth && (
                      <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 mt-1">
                        {expenseDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </span>
                    )}
                    {expense.status === 'pending' && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Due: {new Date(expense.due_date || expense.date).toLocaleDateString()}
                      </p>
                    )}
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${
                      financialCategoryService.getCategoryColor(expense.category)
                    }`}>
                      {financialCategoryService.getCategoryLabel(expense.category)}
                    </span>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(expense.value)}
                      </p>
                      {expense.is_recurring && (
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 mt-1">
                          Recurring
                        </span>
                      )}
                    </div>
                    {expense.status === 'paid' ? (
                      <div className="flex items-center justify-center p-1">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" title="Despesa paga" />
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedExpense(expense);
                          setIsPaymentModalOpen(true);
                        }}
                        className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        Pagar
                      </button>
                    )}
                  </div>
                </div>
              </div>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="flex items-center">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredExpenses.length)}</span> de{' '}
                    <span className="font-medium">{filteredExpenses.length}</span> despesas
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronsLeft size={20} />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronsRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isPaymentModalOpen && selectedExpense && (
        <PaymentModal
          expense={selectedExpense}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedExpense(null);
          }}
          onSubmit={handlePaymentSubmit}
        />
      )}
    </div>
  );
}
