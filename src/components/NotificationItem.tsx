import React from 'react';
import { Transaction } from '../model/types';
import { formatCurrency } from '../utils/formatters';
import { X } from 'lucide-react';

interface NotificationItemProps {
  transaction: Transaction;
  debtorName: string;
  onDismiss: (transactionId: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  transaction,
  debtorName,
  onDismiss
}) => {
  const formatDueDate = (date: string) => {
    const dueDate = new Date(date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays > 1) return `Due in ${diffDays} days`;
    return 'Overdue';
  };

  return (
    <div className="flex items-start justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {debtorName}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {formatCurrency(transaction.value)}
        </p>
        {transaction.due_date && (
          <p className={`text-sm ${
            new Date(transaction.due_date) <= new Date() 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {formatDueDate(transaction.due_date)}
          </p>
        )}
        {transaction.is_recurring && (
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Recurring payment
          </p>
        )}
      </div>
      
      <button
        onClick={() => onDismiss(transaction.id)}
        className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        title="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default NotificationItem;
