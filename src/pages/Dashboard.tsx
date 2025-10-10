import { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Users,
  Package,
  Loader2,
  Lock,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import useSubscriptionFeatures from "../hooks/useSubscriptionFeatures";
import { useOrganizationType } from "../hooks/useOrganizationType";
import { saleService } from "../services/saleService";
import { incomeService } from "../services/incomeService";
import { clientService } from "../services/clientService";
import { personService } from "../services/personService";
import { productService } from "../services/productService";
import { formatCurrency } from "../utils/formatters";
import {
  InsightData,
} from "../model/types";
import { insightsService } from "../services/insightsService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { systemConfigService } from "../services/systemConfigService";
import BusinessIntelligenceModule from "../components/BusinessInteligenceModule"; // Importando o novo componente
import ExportReportsModal from '../components/ExportReportsModal';
import { subscriptionService } from '../services/subscriptionService';

export default function Dashboard() {
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [totalRevenueOrIncome, setTotalRevenueOrIncome] = useState<number | null>(null);
  const [entityCount, setEntityCount] = useState<number | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [trendChartData, setTrendChartData] = useState<Array<{ date: string, total: number }> | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
  const [churnRate, setChurnRate] = useState<number>(0);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const { isPremium, isLoading: isLoadingFeatures } = useSubscriptionFeatures();
  const { isProfit } = useOrganizationType();

  // Debug logs para verificar se as funcionalidades premium estão sendo carregadas
  console.log('🔍 Dashboard Premium Debug:', {
    isPremium,
    isLoadingFeatures
  });
  const navigate = useNavigate();

  // Debug logs
  console.log('🔍 Dashboard Debug:', {
    isPremium,
    isLoadingFeatures,
    isProfit
  });

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
    console.log('🔍 useEffect BI Debug:', {
      isPremium,
      isLoadingFeatures,
      shouldLoadInsights: isPremium && !isLoadingFeatures
    });

    if (isPremium && !isLoadingFeatures) {
      console.log('🚀 Loading insights...');
      loadInsights();
    }
  }, [isPremium, isLoadingFeatures]);

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
          setTrendChartData(chartData.length > 0 ? chartData : [{ date: "Current", total: totalSales }]);

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
          setTrendChartData(chartData.length > 0 ? chartData : [{ date: "Current", total: totalIncome }]);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setTotalRevenueOrIncome(0);
        setEntityCount(0);
        setProductCount(0);
        setTrendChartData([{ date: "Error", total: 0 }]);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchDashboardData();
    calculateChurnRate();
  }, [isProfit]);

  const loadInsights = async () => {
    console.log('🔍 loadInsights called');
    try {
      console.log('📡 Fetching insights from service...');
      const fetchedInsights = await insightsService.getInsights();
      console.log('📊 Insights fetched:', fetchedInsights);
      setInsights(fetchedInsights);
    } catch (error) {
      console.error("❌ Error loading insights data:", error);
      setInsights(null);
    }
  };

  const calculateChurnRate = () => {
    const totalCustomers = 100;
    const churnedCustomers = 5;
    const rate = (churnedCustomers / totalCustomers) * 100;
    setChurnRate(rate);
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-900 dark:text-white">Dashboard</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        {dynamicStats.map((stat) => (
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

      {/* Export Reports Button (Premium) */}
      {isPremium && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar Relatórios
          </button>
        </div>
      )}


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
      ) : !isPremium ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-6 rounded-lg shadow text-center">
          <Lock className="w-12 h-12 text-yellow-500 dark:text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
            Recurso Premium: Business Intelligence
          </h2>
          <p className="text-yellow-700 dark:text-yellow-200 mb-4">
            Desbloqueie insights poderosos sobre seu negócio com nossas ferramentas de Business Intelligence.
          </p>
          <Link
            to="/settings?tab=subscription"
            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            Fazer Upgrade Agora
          </Link>
        </div>
      ) : (
        <div>

          <BusinessIntelligenceModule
            insights={insights}
            churnRate={churnRate}
            isProfit={isProfit}
          />
        </div>
      )}

      {/* Export Reports Modal */}
      <ExportReportsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
