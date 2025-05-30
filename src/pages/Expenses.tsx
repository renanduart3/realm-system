import React, { useState, useEffect } from 'react';
import { transactionService } from '../services/transactionService';
import { financialCategoryService, EXPENSE_CATEGORIES } from '../services/financialCategoryService';
import { Transaction, ExpenseCategory } from '../model/types';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../utils/formatters';
import MonthlyExpensesList from '../components/MonthlyExpensesList';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';

export default function Expenses() {
  const [activeTab, setActiveTab] = useState<'add' | 'monthly'>('add');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    due_date: new Date().toISOString().split('T')[0],
    category: 'others' as ExpenseCategory,
    is_recurring: false,
    status: 'pending' as 'pending' | 'paid'
  });

  const [recentExpenses, setRecentExpenses] = useState<Transaction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const { user } = useAuth();
  const userEmail = user?.email;

  useEffect(() => {
    loadRecentExpenses();
  }, []);

  const loadRecentExpenses = async () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const expenses = await transactionService.getTransactionsByMonth(currentMonth, currentYear);
    setRecentExpenses(expenses);
  };

  const handlePaymentToggle = async (transaction: Transaction) => {
    const newStatus = transaction.status === 'paid' ? 'pending' : 'paid';
    const success = await transactionService.updateTransactionStatus(transaction.id, newStatus);
    if (success) {
      loadRecentExpenses();
      showToast(`Expense marked as ${newStatus}`, 'success');
    } else {
      showToast('Failed to update expense status', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      due_date: new Date().toISOString().split('T')[0],
      category: 'others',
      is_recurring: false,
      status: 'pending'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.amount || !formData.category || !formData.due_date) {
        throw new Error('Please fill in all required fields');
      }

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      // Create the transaction
      const result = await transactionService.createTransaction(
        formData.category,
        amount,
        formData.due_date,
        new Date().toTimeString().split(' ')[0],
        formData.description,
        undefined,
        undefined,
        formData.is_recurring,
        formData.due_date
      );

      if (!result) {
        throw new Error('Failed to create expense');
      }

      // If the expense is marked as paid, update its status
      if (formData.status === 'paid' && result.id) {
        await transactionService.updateTransactionStatus(result.id, 'paid');
      }

      showToast('Expense added successfully', 'success');
      resetForm();
      loadRecentExpenses();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to add expense',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    const { data, error } = await supabaseService
      .from('subscriptions')
      .select('*')
      .eq('email', userEmail)
      .single();

    return data?.status; // 'active', 'canceled', etc.
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expenses</h1>

        <div className="mt-4 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('add')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'add'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Add Expense
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'monthly'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Monthly Expenses
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'add' ? (
        <>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Add Expense</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label mb-2">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {EXPENSE_CATEGORIES.map(category => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, category }))}
                      className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.category === category
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {financialCategoryService.getCategoryLabel(category)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="form-label">
                    Payment Status
                  </label>
                  <div className="mt-2">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio"
                        name="status"
                        value="paid"
                        checked={formData.status === 'paid'}
                        onChange={(e) => setFormData({ ...formData, status: 'paid' })}
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Paid</span>
                    </label>
                    <label className="inline-flex items-center ml-6">
                      <input
                        type="radio"
                        className="form-radio"
                        name="status"
                        value="pending"
                        checked={formData.status === 'pending'}
                        onChange={(e) => setFormData({ ...formData, status: 'pending' })}
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Unpaid</span>
                    </label>
                  </div>
                </div>
              </div>

              {formData.status === 'pending' && (
                <div>
                  <label className="form-label">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_recurring" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Recurring Expense
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 ${
                  isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </div>
                ) : (
                  'Add Expense'
                )}
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Expenses</h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {recentExpenses.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center">No expenses recorded yet</p>
              ) : (
                recentExpenses.map(expense => (
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
        </>
      ) : (
        <MonthlyExpensesList />
      )}
    </div>
  );
}