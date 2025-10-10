import React, { useState, useEffect } from 'react';
import { CombinedExpense } from '../../model/types';
import { expenseAggregatorService } from '../../services/expenseAggregatorService';
import { formatCurrency } from '../../utils/formatters';
import { useOrganizationType } from '../../hooks/useOrganizationType';
import { incomeService } from '../../services/incomeService';
import { 
  DollarSign, 
  AlertTriangle, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Plus,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface OverviewTabProps {
  onAddExpense: () => void;
}

export default function OverviewTab({ onAddExpense }: OverviewTabProps) {
  const [summary, setSummary] = useState({
    totalPending: 0,
    totalPaid: 0,
    totalOverdue: 0,
    countPending: 0,
    countPaid: 0,
    countOverdue: 0
  });
  const [upcomingExpenses, setUpcomingExpenses] = useState<CombinedExpense[]>([]);
  const [overdueExpenses, setOverdueExpenses] = useState<CombinedExpense[]>([]);
  const [pendingIncome, setPendingIncome] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isProfit } = useOrganizationType();

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    setIsLoading(true);
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Load monthly summary
      const monthlySummary = await expenseAggregatorService.getMonthlySummary(currentMonth, currentYear);
      setSummary(monthlySummary);

      // Load upcoming expenses (next 7 days)
      const upcoming = await expenseAggregatorService.getUpcomingExpenses(7);
      setUpcomingExpenses(upcoming);

      // Load overdue expenses
      const overdue = await expenseAggregatorService.getOverdueExpenses();
      setOverdueExpenses(overdue);

      // Load pending income (for nonprofits)
      if (!isProfit) {
        const allIncome = await incomeService.getAllIncome();
        const pending = allIncome.filter(income => income.status === 'pending');
        setPendingIncome(pending);
      }
    } catch (error) {
      console.error('Error loading overview data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getExpenseTypeIcon = (expense: CombinedExpense) => {
    if (expense.type === 'virtual') {
      return <div className="w-2 h-2 bg-blue-500 rounded-full" title="Despesa Recorrente" />;
    }
    return <div className="w-2 h-2 bg-gray-500 rounded-full" title="Despesa Pontual" />;
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">A Pagar</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(summary.totalPending)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {summary.countPending} despesa{summary.countPending !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pago</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(summary.totalPaid)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {summary.countPaid} despesa{summary.countPaid !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Atrasado</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(summary.totalOverdue)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {summary.countOverdue} despesa{summary.countOverdue !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-end">
        <button
          onClick={onAddExpense}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Despesa Pontual
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Expenses */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Próximos 7 Dias
          </h3>
          {upcomingExpenses.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Nenhuma despesa nos próximos 7 dias
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingExpenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getExpenseTypeIcon(expense)}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {expense.description}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(expense.dueDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(expense.amount)}
                    </p>
                    {getStatusIcon(expense.status)}
                  </div>
                </div>
              ))}
              {upcomingExpenses.length > 5 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  +{upcomingExpenses.length - 5} mais
                </p>
              )}
            </div>
          )}
        </div>

        {/* Overdue Expenses */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Contas Atrasadas
          </h3>
          {overdueExpenses.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Nenhuma conta atrasada
            </p>
          ) : (
            <div className="space-y-3">
              {overdueExpenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getExpenseTypeIcon(expense)}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {expense.description}
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Venceu em {new Date(expense.dueDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(expense.amount)}
                    </p>
                    <AlertTriangle className="w-4 h-4 text-red-500 ml-auto" />
                  </div>
                </div>
              ))}
              {overdueExpenses.length > 5 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  +{overdueExpenses.length - 5} mais
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pending Income (Nonprofits only) */}
      {!isProfit && pendingIncome.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Valores a Receber
          </h3>
          <div className="space-y-3">
            {pendingIncome.slice(0, 5).map((income) => (
              <div key={income.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {income.description}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(income.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(income.amount)}
                  </p>
                  <TrendingUp className="w-4 h-4 text-green-500 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
