//src/utils/dataLoader.ts
import mockData from '../mocks/dataMock.json';
import { appConfig } from '../config/app.config';
import { getDbEngine } from '../db/engine';
import { 
  SystemConfig,
  ProductService,
  Income,
  Donor,
  Person,
  FinancialCategory,
  SystemUser,
  TransactionType,
  CachedSubscriptionStatus // Added
} from '../model/types';
import { GoogleSheetsSyncService } from '../services/googleSheets.service';
import { INSIGHT_TYPES } from '../db/constants';

const shouldUseMockData = () => {
  return appConfig.isDevelopment && appConfig.useMockData;
};

const convertMockData = {
  systemConfig: (data: any): SystemConfig => ({
    ...data,
    organization_type: data.organization_type as "profit" | "nonprofit",
  }),
  income: (data: any[]): Income[] => data.map(item => ({
    ...item,
    type: item.type as TransactionType,
  })),
  donors: (data: any[]): Donor[] => data.map(item => ({
    ...item,
    type: item.type as "organization" | "individual" | "company",
  })),
  financialCategories: (data: any[]): FinancialCategory[] => data.map(item => ({
    ...item,
    type: item.type as "income" | "expense",
  })),
  systemUsers: (data: any[]): SystemUser[] => data.map(item => ({
    ...item,
    role: item.role as "master" | "seller",
    nature_type: item.nature_type as "profit" | "nonprofit",
  })),
};

export const loadInitialData = async () => {
  if (!shouldUseMockData()) return;

  try {
    // Verifica se já existem dados no banco
    const existingConfig = await getDbEngine().getSystemConfig('system-config');
    if (existingConfig) {
      console.log('Database already initialized');
      return;
    }

    // Carrega os dados mock sem deletar o banco
    await getDbEngine().putSystemConfig(convertMockData.systemConfig(mockData.systemConfig));
    for (const p of mockData.products) await (getDbEngine() as any).upsertProduct?.(p);
    for (const i of convertMockData.income(mockData.income)) await (getDbEngine() as any).upsertIncome?.(i);
    for (const d of convertMockData.donors(mockData.donors)) await (getDbEngine() as any).upsertDonor?.(d);
    for (const pe of mockData.persons) await (getDbEngine() as any).upsertPerson?.(pe);
    for (const fc of convertMockData.financialCategories(mockData.financialCategories)) await (getDbEngine() as any).upsertFinancialCategory?.(fc);
    for (const u of convertMockData.systemUsers(mockData.systemUsers)) await (getDbEngine() as any).upsertSystemUser?.(u);

    console.log('Mock data loaded successfully (core tables)');

    // Sub-step 7.1: Mock Premium Subscription
    const mockPremiumStatus: CachedSubscriptionStatus = {
      id: 'currentUser', // As per type definition
      status: 'active',
      planName: 'premium',
      interval: 'month',
      currentPeriodStart: new Date(new Date().setDate(1)).toISOString(), // Start of current month
      currentPeriodEnd: new Date(new Date(new Date().setMonth(new Date().getMonth() + 1)).setDate(0)).toISOString(), // End of current month
      cancelAtPeriodEnd: false,
      stripeSubscriptionId: 'mock_sub_premium_12345',
      stripeCustomerId: 'mock_cus_premium_12345',
      lastSync: new Date().toISOString(),
      userId: 'mockUser123' // Optional user ID
    };
    await (getDbEngine() as any).putSubscriptionStatus?.(mockPremiumStatus);
    console.log('Mock premium subscription status loaded.');

    // Sub-step 7.2: Mock Insights Data
    const googleSheetsSync = new GoogleSheetsSyncService(); // Ensure this service doesn't require live auth for mock generation
    const currentYear = new Date().getFullYear();
    // Assuming generateInsights can work with a year or might need adjustment for purely mock data
    // For this task, we assume it can generate some form of bundle.
    // If generateInsights relies on live data/services, this part would need mock implementations within GoogleSheetsSyncService itself.
    const insightsBundle = await googleSheetsSync.generateInsights(currentYear);

    const storeInsight = async (type: string, data: any, year: number) => {
      if (data) {
        await (getDbEngine() as any).putInsight?.({
          id: `mock-${type.toLowerCase().replace(/_/g, '-')}-${year}`, // Ensure _ are replaced if type comes from INSIGHT_TYPES
          type: type as any, // Cast if necessary
          data: data,
          timestamp: new Date().toISOString(),
          year: year,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    };

    if (insightsBundle) {
        await storeInsight(INSIGHT_TYPES.DEMAND, insightsBundle.demandPrediction, currentYear);
        await storeInsight(INSIGHT_TYPES.SENTIMENT, insightsBundle.customerSentiment, currentYear);
        await storeInsight(INSIGHT_TYPES.EXPENSE, insightsBundle.expenseAnalysis, currentYear);
        await storeInsight(INSIGHT_TYPES.SALES, insightsBundle.salesPerformance, currentYear);
        await storeInsight(INSIGHT_TYPES.FIDELIZATION, insightsBundle.fidelization, currentYear);
        console.log('Mock insights data loaded.');
    } else {
        console.warn('Insights bundle was not generated by GoogleSheetsSyncService. Mock insights not loaded.');
    }

  } catch (error) {
    console.error('Error loading mock data:', error);
  }
};

// Funções auxiliares para recuperar dados
export const getMockData = async <T>(tableName: string): Promise<T[]> => {
  if (!shouldUseMockData()) return [];
  return (mockData as any)[tableName] || [];
};

export const getAllProducts = async (): Promise<ProductService[]> => {
  try {
    const products = await (getDbEngine() as any).listProducts?.() || [];
    return products.map(product => ({
      ...product,
      category: product.category || 'Geral',
      description: product.description || ''
    }));
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
};

