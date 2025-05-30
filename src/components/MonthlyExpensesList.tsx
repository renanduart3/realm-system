import React, { useState, useEffect } from 'react';
import { Transaction, ExpenseCategory } from '../model/types';
import { transactionService } from '../services/transactionService';
import { financialCategoryService } from '../services/financialCategoryService';
import { formatCurrency } from '../utils/formatters';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import PaymentModal from './PaymentModal';

export default function MonthlyExpensesList() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all');
  const [selectedExpense, setSelectedExpense] = useState<Transaction | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadExpenses();
  }, [currentDate]);

  const loadExpenses = async () => {
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const monthlyExpenses = await transactionService.getTransactionsByMonth(month, year);
    setExpenses(monthlyExpenses);
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
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="space-y-4">
          {filteredExpenses.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No expenses found for this period
            </p>
          ) : (
            filteredExpenses.map(expense => (
              <div
                key={expense.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {expense.description || 'Untitled Expense'}
                    </h3>
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
                    <button
                      onClick={() => handlePaymentToggle(expense)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        expense.status === 'paid'
                          ? 'bg-green-500'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                      role="switch"
                      aria-checked={expense.status === 'paid'}
                    >
                      <span className="sr-only">
                        {expense.status === 'paid' ? 'Mark as unpaid' : 'Mark as paid'}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          expense.status === 'paid' ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
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
