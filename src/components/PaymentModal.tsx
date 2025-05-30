import React, { useState } from 'react';
import { Transaction } from '../model/types';
import { formatCurrency } from '../utils/formatters';

interface PaymentModalProps {
  expense: Transaction;
  onClose: () => void;
  onSubmit: (amount: number, interest?: number) => void;
}

export default function PaymentModal({ expense, onClose, onSubmit }: PaymentModalProps) {
  const [amount, setAmount] = useState(expense.value.toString());
  const [interest, setInterest] = useState('');
  const [isPartialPayment, setIsPartialPayment] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paymentAmount = parseFloat(amount);
    const interestAmount = interest ? parseFloat(interest) : undefined;
    
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return;
    }

    onSubmit(paymentAmount, interestAmount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Record Payment
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Total Amount Due
              </label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(expense.value)}
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="partial-payment"
                checked={isPartialPayment}
                onChange={(e) => {
                  setIsPartialPayment(e.target.checked);
                  if (!e.target.checked) {
                    setAmount(expense.value.toString());
                  }
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="partial-payment" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Partial Payment
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Payment Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!isPartialPayment}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Interest Amount (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Record Payment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
