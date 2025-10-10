import React from 'react';
import { InsightData } from '../model/types';
import { Brain, Heart, PieChart, BarChart, Award, TrendingDown, Users } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface BusinessIntelligenceModuleProps {
  insights: InsightData | null;
  churnRate: number;
  isProfit: boolean;
}

const InsightCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow">
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
    </div>
    <div className="space-y-2">
      {children}
    </div>
  </div>
);

const BusinessIntelligenceModule: React.FC<BusinessIntelligenceModuleProps> = ({ insights, churnRate, isProfit }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
      {/* Churn Rate / Evasão */}
      <InsightCard
        icon={isProfit ? <TrendingDown className="text-red-500 w-5 h-5" /> : <Users className="text-red-500 w-5 h-5" />}
        title={isProfit ? "Churn Rate" : "Taxa de Evasão"}
      >
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {churnRate.toFixed(2)}%
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isProfit ? "Clientes" : "Participantes"} em risco de {isProfit ? "churn" : "evasão"}.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Ação sugerida: Iniciar campanha de reengajamento.
        </p>
      </InsightCard>

      {isProfit ? (
        <>
          {/* Demand Prediction */}
          <InsightCard icon={<Brain className="text-purple-600 dark:text-purple-500 w-5 h-5" />} title="Previsão de Demanda">
            {insights?.demandPrediction?.topProducts && insights.demandPrediction.topProducts.length > 0 ? (
              insights.demandPrediction.topProducts.map((product, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">{product.name}</span>
                  <span className={`text-sm font-semibold ${product.trend === "up" ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>
                    {product.predictedDemand} un.
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Dados de previsão de demanda indisponíveis.</p>
            )}
          </InsightCard>

          {/* Customer Sentiment */}
          <InsightCard icon={<Heart className="text-red-600 dark:text-red-500 w-5 h-5" />} title="Satisfação do Cliente">
            {insights?.customerSentiment?.overallSentiment ? (
              <>
                <div className="text-center text-3xl font-bold text-blue-600 dark:text-blue-500">
                  {(insights.customerSentiment.overallSentiment * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-center text-gray-600 dark:text-gray-400">
                  Tendência: {insights.customerSentiment.recentTrend}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Dados de satisfação do cliente indisponíveis.</p>
            )}
          </InsightCard>

          {/* Sales Performance */}
          <InsightCard icon={<BarChart className="text-blue-600 dark:text-blue-500 w-5 h-5" />} title="Performance de Vendas">
            {insights?.salesPerformance?.topProducts && insights.salesPerformance.topProducts.length > 0 ? (
              insights.salesPerformance.topProducts.map((product, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">{product.name}</span>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-500">{formatCurrency(product.revenue)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Dados de performance de vendas indisponíveis.</p>
            )}
          </InsightCard>

          {/* Fidelization */}
          <InsightCard icon={<Award className="text-yellow-600 dark:text-yellow-500 w-5 h-5" />} title="Fidelização">
            {insights?.fidelization?.topCustomers && insights.fidelization.topCustomers.length > 0 ? (
              insights.fidelization.topCustomers.map((customer, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">{customer.name}</span>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-500">{formatCurrency(customer.totalPurchases)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Dados de fidelização indisponíveis.</p>
            )}
          </InsightCard>
        </>
      ) : (
        <>
          {/* Program Impact */}
          <InsightCard icon={<Heart className="text-teal-500 w-5 h-5" />} title="Impacto dos Programas">
            {insights?.programImpact?.programs && insights.programImpact.programs.length > 0 ? (
               insights.programImpact.programs.map((program, index) => (
                <div key={index} className="text-sm">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{program.name}</p>
                  <p className="text-gray-600 dark:text-gray-400">Beneficiários: {program.beneficiariesReached}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Dados de impacto indisponíveis.</p>
            )}
          </InsightCard>
          
          {/* Donor Engagement */}
          <InsightCard icon={<Users className="text-indigo-500 w-5 h-5" />} title="Engajamento de Doadores">
             {insights?.donorEngagement ? (
               <div className="text-sm space-y-2">
                 <p>Doadores Ativos: <span className="font-semibold">{insights.donorEngagement.activeDonors}</span></p>
                 <p>Doação Média: <span className="font-semibold">{formatCurrency(insights.donorEngagement.averageDonationAmount)}</span></p>
               </div>
             ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Dados de engajamento indisponíveis.</p>
             )}
          </InsightCard>
        </>
      )}

      {/* Expense Analysis (Comum para ambos) */}
      <InsightCard icon={<PieChart className="text-green-600 dark:text-green-500 w-5 h-5" />} title="Análise de Despesas">
        {insights?.expenseAnalysis?.topExpenses && insights.expenseAnalysis.topExpenses.length > 0 ? (
          insights.expenseAnalysis.topExpenses.map((expense, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">{expense.category}</span>
              <span className={`text-sm font-semibold ${expense.trend === "up" ? "text-red-600 dark:text-red-500" : "text-green-600 dark:text-green-500"}`}>
                {formatCurrency(expense.amount)}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">Dados de análise de despesas indisponíveis.</p>
        )}
      </InsightCard>
    </div>
  );
};

export default BusinessIntelligenceModule;
