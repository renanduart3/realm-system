import React, { useState } from 'react';
import { CombinedExpense, RecurringExpense } from '../model/types';
import { useToast } from '../hooks/useToast';
import { useOrganizationType } from '../hooks/useOrganizationType';
import OverviewTab from '../components/expenses/OverviewTab';
import MonthlyExpensesTab from '../components/expenses/MonthlyExpensesTab';
import RecurringExpensesTab from '../components/expenses/RecurringExpensesTab';
import AddExpenseModal from '../components/expenses/AddExpenseModal';
import RecurringExpenseModal from '../components/expenses/RecurringExpenseModal';
import PayRecurringModal from '../components/expenses/PayRecurringModal';
import { transactionService } from '../services/transactionService';
import { recurringExpenseService } from '../services/recurringExpenseService';

export default function Expenses() {
  const [activeTab, setActiveTab] = useState<'overview' | 'monthly' | 'recurring'>('overview');
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isRecurringExpenseModalOpen, setIsRecurringExpenseModalOpen] = useState(false);
  const [isPayRecurringModalOpen, setIsPayRecurringModalOpen] = useState(false);
  const [editingRecurringExpense, setEditingRecurringExpense] = useState<RecurringExpense | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<CombinedExpense | null>(null);
  const { showToast } = useToast();
  const { isProfit } = useOrganizationType();

  const handleAddExpense = () => {
    setIsAddExpenseModalOpen(true);
  };

  const handleAddRecurring = () => {
    setEditingRecurringExpense(null);
    setIsRecurringExpenseModalOpen(true);
  };

  const handleEditRecurring = (expense: RecurringExpense) => {
    setEditingRecurringExpense(expense);
    setIsRecurringExpenseModalOpen(true);
  };

  const handleEditExpense = (expense: CombinedExpense) => {
    // TODO: Implement edit for real expenses
    showToast('Edição de despesas pontuais será implementada em breve', 'info');
  };

  const handleDeleteExpense = async (expense: CombinedExpense) => {
    if (expense.type === 'virtual') {
      showToast('Não é possível excluir despesas virtuais', 'error');
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir a despesa "${expense.description}"?`)) {
      try {
        const success = await transactionService.deleteTransaction(expense.id);
      if (success) {
        showToast('Despesa excluída com sucesso', 'success');
      } else {
          throw new Error('Falha ao excluir despesa');
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Erro ao excluir despesa',
        'error'
      );
      }
    }
  };

  const handlePayExpense = async (expense: CombinedExpense) => {
    if (expense.type === 'virtual') {
      setSelectedExpense(expense);
      setIsPayRecurringModalOpen(true);
      return;
    }
    // Real expense: simple confirm and mark as paid
    const { showConfirmDialog } = await import('../utils/confirmDialog');
    const confirmed = await showConfirmDialog({
      title: 'Quitar despesa',
      message: `Confirmar pagamento da despesa "${expense.description}"?`,
      confirmText: 'Quitar',
      type: 'info'
    });
    if (!confirmed) return;
    const ok = await transactionService.updateTransactionStatus(expense.id, 'paid');
    if (ok) {
      showToast('Despesa marcada como paga', 'success');
    } else {
      showToast('Falha ao marcar como paga', 'error');
    }
  };

  const handleModalSuccess = () => {
    // Refresh data in all tabs
    // This will be handled by each tab component
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestão de Despesas</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Organize suas despesas pontuais e recorrentes de forma inteligente
        </p>

        <div className="mt-4 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'monthly'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Lançamentos do Mês
            </button>
            <button
              onClick={() => setActiveTab('recurring')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'recurring'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Despesas Recorrentes
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab onAddExpense={handleAddExpense} />
      )}

      {activeTab === 'monthly' && (
        <MonthlyExpensesTab
          onEditExpense={handleEditExpense}
          onDeleteExpense={handleDeleteExpense}
          onPayExpense={handlePayExpense}
        />
      )}

      {activeTab === 'recurring' && (
        <RecurringExpensesTab
          onAddRecurring={handleAddRecurring}
          onEditRecurring={handleEditRecurring}
        />
      )}

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddExpenseModalOpen}
        onClose={() => setIsAddExpenseModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <RecurringExpenseModal
        isOpen={isRecurringExpenseModalOpen}
        onClose={() => {
          setIsRecurringExpenseModalOpen(false);
          setEditingRecurringExpense(null);
        }}
        onSuccess={handleModalSuccess}
        editingExpense={editingRecurringExpense}
      />

      <PayRecurringModal
        isOpen={isPayRecurringModalOpen}
        onClose={() => {
          setIsPayRecurringModalOpen(false);
          setSelectedExpense(null);
        }}
        onSuccess={handleModalSuccess}
        expense={selectedExpense}
      />
    </div>
  );
}
