import React from 'react';
import { Transaction } from '../model/types';
import { formatCurrency } from '../utils/formatters';
import { transactionService } from '../services/transactionService';
import { useToast } from '../hooks/useToast';

interface ExpenseItemProps {
  transaction: Transaction;
  categoryName: string;
  onPaymentClick: () => void;
}

const ExpenseItem: React.FC<ExpenseItemProps> = ({
  transaction,
  categoryName,
  onPaymentClick
}) => {
  const { showToast } = useToast();
  const isRecurring = transaction.is_recurring;
  const isPaid = transaction.status === 'paid';
  const hasPartialPayments = transaction.related_transaction_id;
  const canForget = transaction.client_id && transaction.due_date && !isPaid;

  const handleForget = async () => {
    try {
      const success = await transactionService.dismissNotification(transaction.id);
      if (success) {
        showToast('Notification dismissed', 'success');
      } else {
        throw new Error('Failed to dismiss notification');
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to dismiss notification',
        'error'
      );
    }
  };

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left side - Transaction details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {transaction.description || categoryName}
            </h3>
            {isRecurring && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                Recurring
              </span>
            )}
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </span>
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <p>Category: {categoryName}</p>
            <p>Date: {new Date(transaction.date).toLocaleDateString()}</p>
            {transaction.due_date && (
              <p>Due Date: {new Date(transaction.due_date).toLocaleDateString()}</p>
            )}
            {hasPartialPayments && (
              <p>Partial Payment</p>
            )}
          </div>
        </div>

        {/* Right side - Amount and actions */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(transaction.value)}
            </div>
            {transaction.interest_amount && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                + {formatCurrency(transaction.interest_amount)} interest
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {!isPaid && !isRecurring && (
              <button
                onClick={onPaymentClick}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              >
                Record Payment
              </button>
            )}

            {isRecurring && !isPaid && (
              <button
                onClick={onPaymentClick}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800"
              >
                Pay Full Amount
              </button>
            )}

            {canForget && (
              <button
                onClick={handleForget}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:focus:ring-offset-gray-800"
              >
                Forget
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseItem;
