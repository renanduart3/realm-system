import React, { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Users,
  Package,
  Brain,
  Heart,
  PieChart,
  BarChart,
  Award,
  Loader2, // Added for loading state
  Lock, 
} from "lucide-react";
// import { getMockData } from "../services/mockService"; // Will be replaced by actual service calls
import { appConfig } from "../config/app.config";
import { Link, useNavigate } from "react-router-dom";
import useSubscriptionFeatures from "../hooks/useSubscriptionFeatures";
import { useOrganizationType } from "../hooks/useOrganizationType";
import { saleService } from "../services/saleService"; // Added
import { incomeService } from "../services/incomeService"; // Added
import { clientService } from "../services/clientService"; // Added
import { personService } from "../services/personService"; // Added
import { productService } from "../services/productService"; // Added
import { formatCurrency } from "../utils/formatters"; // Added
import {
  Sale,
  Income,
  Client,
  Person,
  ProductService as Product,
  // DemandPrediction, // Will be part of InsightData
  // CustomerSentiment, // Will be part of InsightData
  // ExpenseAnalysis, // Will be part of InsightData
  // SalesPerformance, // Will be part of InsightData
  // Fidelization, // Will be part of InsightData
  InsightData, // Added
  SystemUser,
} from "../model/types";
import { insightsService } from "../services/insightsService"; // Added
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
// import type { // Combined with the type import above
//   DemandPrediction,
//   CustomerSentiment,
//   ExpenseAnalysis,
//   SalesPerformance,
//   Fidelization,
//   SystemUser,
// } from "../model/types";
import { systemConfigService } from "../services/systemConfigService";

// Mock data for sales/income trend - This will be removed
// const mockTrendData = [ 
//   { date: "Jan", total: 4500 },
//   { date: "Feb", total: 5200 },
//   { date: "Mar", total: 4800 },
//   { date: "Apr", total: 6000 },
//   { date: "May", total: 5700 },
//   { date: "Jun", total: 6500 },
//   { date: "Jul", total: 7200 },
//   { date: "Aug", total: 6800 },
//   { date: "Sep", total: 7500 },
//   { date: "Oct", total: 8200 },
//   { date: "Nov", total: 8800 },
//   { date: "Dec", total: 9500 },
// ];

// const stats = [ 
//   { title: "Total Sales", value: "R$ 82.700", icon: DollarSign },
//   { title: "Revenue Growth", value: "+15%", icon: TrendingUp },
//   { title: "Total Clients", value: "124", icon: Users },
//   { title: "Products", value: "45", icon: Package },
// ];

interface ChurnRateData {
  month: string;
  churnRate: number;
}

// interface Insights { // Replaced by InsightData type from model/types
//   demand: {
//     topProducts: {
//       name: string;
//       predictedDemand: number;
//       trend: "up" | "down";
//       confidence: number;
//     }[];
//   } | null;
//   sentiment: {
//     overallSentiment: number;
//     recentTrend: "positive" | "negative" | "neutral";
//     topComplaints: string[];
//     topPraises: string[];
//     recentReviews: string[];
//   } | null;
//   expense: {
//     topExpenses: { category: string; amount: number; trend: "up" | "down" }[];
//   } | null;
//   sales: {
//     topProducts: {
//       name: string;
//       revenue: number;
//       growth: number;
//       date: string;
//     }[];
//   } | null;
//   fidelization: {
//     topCustomers: {
//       name: string;
//       totalPurchases: number;
//       frequentItems: string[];
//       suggestedReward: string;
//     }[];
//   } | null;
// }

export default function Dashboard() {
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [totalRevenueOrIncome, setTotalRevenueOrIncome] = useState<number | null>(null);
  const [entityCount, setEntityCount] = useState<number | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [trendChartData, setTrendChartData] = useState<Array<{ date: string, total: number }> | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
  const [churnRate, setChurnRate] = useState<number>(0);
  const { canUseBusinessIntelligence, isLoading: isLoadingFeatures, isPremium } = useSubscriptionFeatures();
  const { isProfit } = useOrganizationType();
  const navigate = useNavigate();

  // Dynamic stats array definition
  const dynamicStats = [ 
    { title: isProfit ? "Total Sales" : "Total Income", value: isLoadingStats ? "Loading..." : formatCurrency(totalRevenueOrIncome ?? 0), icon: DollarSign },
    { title: isProfit ? "Revenue Growth" : "Income Growth", value: "+15%", icon: TrendingUp }, // Placeholder
    { title: isProfit ? "Total Clients" : "Total Persons", value: isLoadingStats ? "Loading..." : (entityCount ?? 0).toString(), icon: Users },
    ...(isProfit ? [{ title: "Products", value: isLoadingStats ? "Loading..." : (productCount ?? 0).toString(), icon: Package }] : [])
  ];

  useEffect(() => {
    const checkConfig = async () => {
      const config = await systemConfigService.getConfig();
      if (!config?.is_configured) {
        navigate('/setup');
        return;
      }
    };
    checkConfig();
  }, [navigate]);

  useEffect(() => {
    if (canUseBusinessIntelligence && !isLoadingFeatures) {
      loadInsights();
    }
  }, [canUseBusinessIntelligence, isLoadingFeatures]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoadingStats(true);
      try {
        if (isProfit) {
          const sales = await saleService.getAllSales();
          const totalSales = sales.reduce((sum, sale) => sum + sale.value, 0);
          setTotalRevenueOrIncome(totalSales);

          const clients = await clientService.getAllClients();
          setEntityCount(clients.length);

          const products = await productService.getAllProducts();
          setProductCount(products.length);
          
          const monthlySales: { [key: string]: number } = {};
          sales.forEach(sale => {
            const month = new Date(sale.date).toLocaleString('default', { month: 'short' });
            monthlySales[month] = (monthlySales[month] || 0) + sale.value;
          });
          const chartData = Object.entries(monthlySales)
            .map(([date, total]) => ({ date, total }))
            .slice(-12); 
          setTrendChartData(chartData.length > 0 ? chartData : [{date: "Current", total: totalSales}]);

        } else { 
          const incomes = await incomeService.getAllIncome();
          const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
          setTotalRevenueOrIncome(totalIncome);

          const persons = await personService.getAllPersons();
          setEntityCount(persons.length);
          setProductCount(null); 

          const monthlyIncomes: { [key: string]: number } = {};
          incomes.forEach(income => {
            const month = new Date(income.date).toLocaleString('default', { month: 'short' });
            monthlyIncomes[month] = (monthlyIncomes[month] || 0) + income.amount;
          });
          const chartData = Object.entries(monthlyIncomes)
            .map(([date, total]) => ({ date, total }))
            .slice(-12);
          setTrendChartData(chartData.length > 0 ? chartData : [{date: "Current", total: totalIncome}]);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setTotalRevenueOrIncome(0);
        setEntityCount(0);
        setProductCount(0);
        setTrendChartData([{date: "Error", total: 0}]);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, [isProfit]);

  const loadInsights = async () => {
    try {
      const fetchedInsights = await insightsService.getInsights();
      setInsights(fetchedInsights);
    } catch (error) {
      console.error("Error loading insights data:", error);
      setInsights(null); // Set to null or a default error state if preferred
    }
  };

  const calculateChurnRate = () => {
    const totalCustomers = 100; 
    const churnedCustomers = 5; 
    const rate = (churnedCustomers / totalCustomers) * 100;
    setChurnRate(rate);
  };

  useEffect(() => {
    calculateChurnRate();
  }, []);

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-900 dark:text-white">Dashboard</h1>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        {dynamicStats.map((stat) => ( // Changed to dynamicStats
          <div
            key={stat.title} 
            className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className="text-lg md:text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                  {stat.value}
                </p>
              </div>
              <stat.icon className="text-blue-600 dark:text-blue-500 w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Engagement/Churn Rate Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {isProfit ? "Churn Rate" : "Taxa de Evasão"} 
        </h2>
        <p className="text-xl font-bold text-gray-900 dark:text-white">
          {churnRate.toFixed(2)}%
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isProfit ? "Clientes" : "Participantes"} em risco de {isProfit ? "churn" : "evasão"}.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Ação sugerida: Entre em contato com {isProfit ? "clientes" : "participantes"} em risco.
        </p>
      </div>

      {/* Sales/Income Trend Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {isProfit ? 'Sales Trend' : 'Income Trend'}
        </h2>
        <div className="h-80 w-full">
          {isLoadingStats ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="ml-3 text-gray-600 dark:text-gray-400">Loading chart data...</p>
            </div>
          ) : (
            <ResponsiveContainer>
              <LineChart data={trendChartData ?? []} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#6B7280" tick={{ fill: '#6B7280' }} />
                <YAxis stroke="#6B7280" tick={{ fill: '#6B7280' }} tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#F3F4F6' }} formatter={(value: number) => [formatCurrency(value), isProfit ? 'Revenue' : 'Income']} />
                <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', strokeWidth: 2 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Business Intelligence Section */}
      {isLoadingFeatures ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400">Carregando recursos de Business Intelligence...</p>
        </div>
      ) : !canUseBusinessIntelligence ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-6 rounded-lg shadow text-center">
          <Lock className="w-12 h-12 text-yellow-500 dark:text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
            Recurso Premium: Business Intelligence
          </h2>
          <p className="text-yellow-700 dark:text-yellow-200 mb-4">
            Desbloqueie insights poderosos sobre seu negócio com nossas ferramentas de Business Intelligence.
          </p>
          <Link
            to="/subscription"
            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            Fazer Upgrade Agora
          </Link>
        </div>
      ) : (
        // Actual BI Cards (rendered if user has access)
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {/* Demand Prediction */}
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="text-purple-600 dark:text-purple-500 w-5 h-5" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Previsão de Demanda</h2>
            </div>
            <div className="space-y-2">
              {insights?.demandPrediction?.topProducts && insights.demandPrediction.topProducts.length > 0 
                ? insights.demandPrediction.topProducts.map((product, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-gray-300">{product.name}</span>
                      <span className={`text-sm ${product.trend === "up" ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>
                        {product.predictedDemand} un.
                      </span>
                    </div>
                  )) 
                : <p className="text-sm text-gray-500 dark:text-gray-400">Dados de previsão de demanda indisponíveis.</p>}
            </div>
          </div>

          {/* Customer Sentiment */}
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="text-red-600 dark:text-red-500 w-5 h-5" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Satisfação do Cliente</h2>
            </div>
            <div className="space-y-2">
              {insights?.customerSentiment?.overallSentiment ? (
                <>
                  <div className="text-center text-2xl font-bold text-blue-600 dark:text-blue-500">
                    {((insights.customerSentiment.overallSentiment) * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-center text-gray-600 dark:text-gray-400">
                    Tendência: {insights.customerSentiment.recentTrend}
                  </div>
                </>
              ) : <p className="text-sm text-gray-500 dark:text-gray-400">Dados de satisfação do cliente indisponíveis.</p>}
            </div>
          </div>

          {/* Expense Analysis */}
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="text-green-600 dark:text-green-500 w-5 h-5" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Análise de Despesas</h2>
            </div>
            <div className="space-y-2">
              {insights?.expenseAnalysis?.topExpenses && insights.expenseAnalysis.topExpenses.length > 0 
                ? insights.expenseAnalysis.topExpenses.map((expense, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-gray-300">{expense.category}</span>
                      <span className={`text-sm ${expense.trend === "up" ? "text-red-600 dark:text-red-500" : "text-green-600 dark:text-green-500"}`}>
                        R$ {expense.amount}
                      </span>
                    </div>
                  )) 
                : <p className="text-sm text-gray-500 dark:text-gray-400">Dados de análise de despesas indisponíveis.</p>}
            </div>
          </div>

          {/* Sales Performance - Conditional */}
          {isProfit && (
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow">
              <div className="flex items-center gap-2 mb-4">
                <BarChart className="text-blue-600 dark:text-blue-500 w-5 h-5" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Performance de Vendas</h2>
              </div>
              <div className="space-y-2">
                {insights?.salesPerformance?.topProducts && insights.salesPerformance.topProducts.length > 0 
                  ? insights.salesPerformance.topProducts.map((product, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300">{product.name}</span>
                        <span className="text-sm text-blue-600 dark:text-blue-500">R$ {product.revenue}</span>
                      </div>
                    )) 
                  : <p className="text-sm text-gray-500 dark:text-gray-400">Dados de performance de vendas indisponíveis.</p>}
              </div>
            </div>
          )}

          {/* Fidelization / Engagement (Title can be dynamic too if needed) */}
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow">
            <div className="flex items-center gap-2 mb-4">
              <Award className="text-yellow-600 dark:text-yellow-500 w-5 h-5" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Fidelização</h2>
            </div>
            <div className="space-y-2">
              {insights?.fidelization?.topCustomers && insights.fidelization.topCustomers.length > 0 
                ? insights.fidelization.topCustomers.map((customer, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-gray-300">{customer.name}</span>
                      <span className="text-sm text-blue-600 dark:text-blue-500">R$ {customer.totalPurchases}</span>
                    </div>
                  )) 
                : <p className="text-sm text-gray-500 dark:text-gray-400">Dados de fidelização indisponíveis.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
