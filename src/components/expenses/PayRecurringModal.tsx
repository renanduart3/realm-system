import React, { useState } from 'react';
import { CombinedExpense } from '../../model/types';
import { expenseAggregatorService } from '../../services/expenseAggregatorService';
import { useToast } from '../../hooks/useToast';
import { X, DollarSign, Calendar, FileText, AlertCircle } from 'lucide-react';

interface PayRecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expense: CombinedExpense | null;
}

export default function PayRecurringModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  expense 
}: PayRecurringModalProps) {
  const [formData, setFormData] = useState({
    amount: '',
    interest: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  React.useEffect(() => {
    if (expense) {
      setFormData({
        amount: expense.amount.toString(),
        interest: '',
        notes: ''
      });
    }
  }, [expense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!expense || !expense.recurringExpenseId) {
        throw new Error('Dados da despesa não encontrados');
      }

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Digite um valor válido');
      }

      const interest = formData.interest ? parseFloat(formData.interest) : undefined;
      if (interest !== undefined && (isNaN(interest) || interest < 0)) {
        throw new Error('Valor de juros inválido');
      }

      // Get current month and year
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      // Mark virtual expense as paid
      const transaction = await expenseAggregatorService.markVirtualAsPaid(
        expense.recurringExpenseId,
        month,
        year,
        amount,
        interest
      );

      if (!transaction) {
        throw new Error('Falha ao registrar pagamento');
      }

      showToast('Pagamento registrado com sucesso', 'success');
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Falha ao registrar pagamento',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      interest: '',
      notes: ''
    });
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      resetForm();
    }
  };

  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Registrar Pagamento
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Expense Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Despesa Recorrente
            </h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <FileText className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-gray-700 dark:text-gray-300">{expense.description}</span>
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-gray-700 dark:text-gray-300">
                  Vence em {new Date(expense.dueDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Valor Pago *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="0,00"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Valor original: R$ {expense.amount.toFixed(2)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Juros (opcional)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.interest}
              onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="0,00"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Adicione juros se houver atraso no pagamento
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              rows={3}
              placeholder="Ex: Pagamento via PIX, referência bancária, etc."
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  O que acontece ao confirmar?
                </h3>
                <div className="mt-1 text-sm text-blue-700 dark:text-blue-200">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Uma transação será criada registrando este pagamento</li>
                    <li>A despesa virtual será marcada como "paga"</li>
                    <li>O histórico de pagamentos será mantido</li>
                    <li>A despesa continuará sendo gerada nos próximos meses</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Registrando...' : 'Registrar Pagamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
