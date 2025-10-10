import React, { useState, useEffect } from 'react';
import { RecurringExpense, SpecificExpenseCategory } from '../../model/types';
import { recurringExpenseService } from '../../services/recurringExpenseService';
import { financialCategoryService } from '../../services/financialCategoryService';
import { useToast } from '../../hooks/useToast';
import { X, DollarSign, Calendar, FileText, Repeat } from 'lucide-react';

interface RecurringExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingExpense?: RecurringExpense | null;
}

export default function RecurringExpenseModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  editingExpense 
}: RecurringExpenseModalProps) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'others' as SpecificExpenseCategory,
    dayOfMonthDue: 1,
    active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        description: editingExpense.description,
        amount: editingExpense.amount.toString(),
        category: editingExpense.category,
        dayOfMonthDue: editingExpense.dayOfMonthDue,
        active: editingExpense.active
      });
    } else {
      resetForm();
    }
  }, [editingExpense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.amount || !formData.description) {
        throw new Error('Preencha todos os campos obrigatórios');
      }

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Digite um valor válido');
      }

      if (formData.dayOfMonthDue < 1 || formData.dayOfMonthDue > 31) {
        throw new Error('Dia do mês deve estar entre 1 e 31');
      }

      const expenseData = {
        description: formData.description,
        amount,
        category: formData.category,
        dayOfMonthDue: formData.dayOfMonthDue,
        active: formData.active
      };

      if (editingExpense) {
        // Update existing expense
        const success = await recurringExpenseService.update(editingExpense.id, expenseData);
        if (success) {
          showToast('Despesa recorrente atualizada com sucesso', 'success');
        } else {
          throw new Error('Falha ao atualizar despesa recorrente');
        }
      } else {
        // Create new expense
        await recurringExpenseService.create(expenseData);
        showToast('Despesa recorrente criada com sucesso', 'success');
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Falha ao salvar despesa recorrente',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      category: 'others',
      dayOfMonthDue: 1,
      active: true
    });
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      resetForm();
    }
  };

  const generateDayOptions = () => {
    const days = [];
    for (let i = 1; i <= 31; i++) {
      days.push(i);
    }
    return days;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editingExpense ? 'Editar Despesa Recorrente' : 'Adicionar Despesa Recorrente'}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Descrição *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ex: Aluguel do escritório"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Valor *
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Categoria
            </label>
            <div className="grid grid-cols-2 gap-2">
              {financialCategoryService.getSpecificExpenseCategories().map(category => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setFormData({ ...formData, category })}
                  className={`p-3 rounded-lg text-sm font-medium transition-colors flex items-center ${
                    formData.category === category
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="mr-2">{financialCategoryService.getCategoryIcon(category)}</span>
                  {financialCategoryService.getCategoryLabel(category)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Dia do Mês de Vencimento *
            </label>
            <select
              value={formData.dayOfMonthDue}
              onChange={(e) => setFormData({ ...formData, dayOfMonthDue: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            >
              {generateDayOptions().map(day => (
                <option key={day} value={day}>
                  {day === 1 ? '1º' : `${day}º`} do mês
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Esta despesa será gerada automaticamente todo mês neste dia
            </p>
          </div>

          {editingExpense && (
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Despesa ativa (aparece nos próximos meses)
                </span>
              </label>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-start">
              <Repeat className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Como funciona?
                </h3>
                <div className="mt-1 text-sm text-blue-700 dark:text-blue-200">
                  <p>Esta despesa será gerada automaticamente todo mês no dia {formData.dayOfMonthDue === 1 ? '1º' : `${formData.dayOfMonthDue}º`}.</p>
                  <p className="mt-1">Você poderá marcar como "paga" quando efetuar o pagamento.</p>
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting 
                ? (editingExpense ? 'Atualizando...' : 'Criando...') 
                : (editingExpense ? 'Atualizar' : 'Criar Despesa Recorrente')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
