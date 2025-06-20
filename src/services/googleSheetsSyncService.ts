import { db, INSIGHT_TYPES } from '../db/AppDatabase';
import { appConfig } from '../config/app.config';
import dataMock from '../mocks/dataMock.json';
import { 
  Sale, 
  Income, 
  Expense, 
  SystemConfig,
  ProductService,
  Person,
  Client,
  BaseEntity,
  DemandPrediction, 
  CustomerSentiment, 
  ExpenseAnalysis, 
  SalesPerformance, 
  Fidelization,
  InsightData
} from '../model/types';


interface SyncMetadata {
  id: string;
  year: number;
  sheetId: string;
  lastSync: string;
  status: 'pending' | 'syncing' | 'completed' | 'error';
  error?: string;
}

interface SyncData {
  id: string;
  year: number;
  date: string;
  data: any[];
}

export class GoogleSheetsSyncService {
  private static readonly SYNC_TYPES = {
    SALES: 'sales',
    INCOME: 'income',
    EXPENSES: 'expenses',
    INSIGHTS: 'insights'
  };

  private static readonly INSIGHT_TYPES = INSIGHT_TYPES;

  async initializeYearSync(year: number, isPremium: boolean): Promise<SyncMetadata> {
    if (!isPremium) {
      throw new Error('This is a premium feature. Please upgrade your subscription to use Google Sheets sync.');
    }
    const metadata: SyncMetadata = {
      id: `sync-${year}`,
      year,
      sheetId: '',
      lastSync: new Date().toISOString(),
      status: 'pending'
    };

    await db.syncMetadata.put(metadata);
    return metadata;
  }

  async syncYear(year: number, isPremium: boolean): Promise<boolean> {
    if (!isPremium) {
      throw new Error('This is a premium feature. Please upgrade your subscription to use Google Sheets sync.');
    }
    try {
      let metadata = await db.syncMetadata.get(`sync-${year}`);
      if (!metadata) {
        // If initializeYearSync is called from here, it also needs the isPremium flag.
        // However, the flow implies initializeYearSync would be called first independently.
        // For robustness, if it *could* be called first time here, it needs isPremium.
        // Assuming for now initializeYearSync is called separately and has its own check.
        // If not, then: metadata = await this.initializeYearSync(year, isPremium);
        // For this iteration, let's assume initializeYearSync was called prior and metadata should exist or this is an error flow.
        // A simpler approach if it can be created here:
        metadata = await db.syncMetadata.get(`sync-${year}`) || await this.initializeYearSync(year, isPremium);
      }

      await db.syncMetadata.update(metadata.id, { status: 'syncing' });

      const config = await db.systemConfig.get('system-config') as SystemConfig;
      const isProfit = config.organization_type === 'profit';

      // Busca dados do ano específico
      const [sales, income, expenses] = await Promise.all([
        isProfit ? db.sales.where('year').equals(year).toArray() : [],
        db.income.where('year').equals(year).toArray(),
        db.expenses.where('year').equals(year).toArray()
      ]);

      // Prepara dados para sincronização
      // Pass isPremium to generateInsights if its sub-methods are to be gated individually
      // and not just by the top-level syncYear call.
      const syncData = {
        sales,
        income,
        expenses,
        insights: await this.generateInsights(year, isPremium) // Pass isPremium down
      };

      // Salva na tabela de sync
      await Promise.all([
        isProfit && db.syncSales.put({
          id: `${year}-sales`,
          year,
          date: new Date().toISOString(),
          data: syncData.sales
        }),
        db.syncIncome.put({
          id: `${year}-income`,
          year,
          date: new Date().toISOString(),
          data: syncData.income
        }),
        db.syncExpenses.put({
          id: `${year}-expenses`,
          year,
          date: new Date().toISOString(),
          data: syncData.expenses
        })
      ]);

      await db.syncMetadata.update(metadata.id, {
        lastSync: new Date().toISOString(),
        status: 'completed'
      });

      return true;
    } catch (error) {
      console.error('Erro na sincronização:', error);
      await db.syncMetadata.update(`sync-${year}`, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      return false;
    }
  }

  async backupToOldFolder(isPremium: boolean): Promise<boolean> {
    if (!isPremium) {
      console.warn("Attempted to use backup feature without premium subscription.");
      return false;
    }
    try {
      const config = await db.systemConfig.get('system-config');
      if (!config?.sheet_ids) return false;

      // Implementar lógica de backup para pasta "old"
      // Usando Google Drive API
      
      return true;
    } catch (error) {
      console.error('Erro ao fazer backup:', error);
      return false;
    }
  }

  private async generateInsights(year: number, isPremium: boolean) { // Added isPremium
    const config = await db.systemConfig.get('system-config') as SystemConfig;
    const isProfit = config.organization_type === 'profit';

    // Pass isPremium to each BI method
    return {
      demandPrediction: isProfit ? await this.getDemandPrediction(isPremium) : null,
      customerSentiment: isProfit ? await this.getCustomerSentiment(isPremium) : null,
      expenseAnalysis: await this.getExpenseAnalysis(isPremium),
      salesPerformance: isProfit ? await this.getSalesPerformance(isPremium) : null,
      fidelization: isProfit ? await this.getFidelizationInsights(isPremium) : null
    };
  }

  // Business Intelligence Methods
  async getDemandPrediction(isPremium: boolean) {
    if (!isPremium) {
      console.warn("Attempted to access premium demand prediction insight without valid subscription.");
      return this.getDefaultDemandPrediction();
    }
    try {
      // Get the latest demand prediction from IndexedDB
      const insight = await db.insights
        .where('type')
        .equals(GoogleSheetsSyncService.INSIGHT_TYPES.DEMAND)
        .reverse()
        .first();

      if (!insight || this.isInsightStale(insight.timestamp)) {
        // Calculate new prediction
        const transactions = await db.transactions.toArray();
        const products = await db.products.toArray();
        
        // Perform demand prediction analysis
        const prediction = this.calculateDemandPrediction(transactions, products);
        
        // Store new predictio

        return prediction;
      }

      return insight.data;
    } catch (error) {
      console.error('Failed to get demand prediction:', error);
      return this.getDefaultDemandPrediction();
    }
  }

  private calculateDemandPrediction(transactions: any[], products: any[]) {
    // Implement actual prediction logic here
    return this.getDefaultDemandPrediction();
  }

  private getDefaultDemandPrediction(): DemandPrediction {
    return {
      topProducts: [
        { name: 'Product A', predictedDemand: 150, trend: 'up', confidence: 0.85 },
        { name: 'Product B', predictedDemand: 80, trend: 'down', confidence: 0.75 },
      ],
      seasonalTrends: {
        summer: ['Product A', 'Product C'],
        winter: ['Product B', 'Product D'],
      }
    };
  }

  async getCustomerSentiment(isPremium: boolean) {
    if (!isPremium) {
      console.warn("Attempted to access premium customer sentiment insight without valid subscription.");
      return this.getDefaultCustomerSentiment();
    }
    try {
      const insight = await db.insights
        .where('type')
        .equals(GoogleSheetsSyncService.INSIGHT_TYPES.SENTIMENT)
        .reverse()
        .first();

      if (!insight || this.isInsightStale(insight.timestamp)) {
        const transactions = await db.transactions.toArray();
        const sentiment = this.analyzeSentiment(transactions);
        
        return sentiment;
      }

      return insight.data;
    } catch (error) {
      console.error('Failed to get customer sentiment:', error);
      return this.getDefaultCustomerSentiment();
    }
  }

  private analyzeSentiment(transactions: any[]) {
    // Implement actual sentiment analysis logic here
    return this.getDefaultCustomerSentiment();
  }

  private getDefaultCustomerSentiment(): CustomerSentiment {
    return {
      overallSentiment: 0.8,
      recentTrend: 'positive',
      topComplaints: ['delivery time', 'pricing'],
      topPraises: ['product quality', 'customer service'],
      recentReviews: [
        { text: 'Great service!', sentiment: 0.9, date: '2024-03-15' },
        { text: 'Product was okay', sentiment: 0.6, date: '2024-03-14' },
      ]
    };
  }

  async getExpenseAnalysis(isPremium: boolean) {
    if (!isPremium) {
      console.warn("Attempted to access premium expense analysis insight without valid subscription.");
      return this.getDefaultExpenseAnalysis();
    }
    try {
      const insight = await db.insights
        .where('type')
        .equals(GoogleSheetsSyncService.INSIGHT_TYPES.EXPENSE)
        .reverse()
        .first();

      if (!insight || this.isInsightStale(insight.timestamp)) {
        const transactions = await db.transactions
          .where('type')
          .equals('expense')
          .toArray();
        
        const analysis = this.analyzeExpenses(transactions);
        
        return analysis;
      }

      return insight.data;
    } catch (error) {
      console.error('Failed to get expense analysis:', error);
      return this.getDefaultExpenseAnalysis();
    }
  }

  private analyzeExpenses(transactions: any[]) {
    // Implement actual expense analysis logic here
    return this.getDefaultExpenseAnalysis();
  }

  private getDefaultExpenseAnalysis(): ExpenseAnalysis {
    return {
      topExpenses: [
        { category: 'Utilities', amount: 2500, trend: 'up' },
        { category: 'Supplies', amount: 1800, trend: 'down' },
      ],
      savingsOpportunities: [
        { category: 'Electricity', potential: 300, suggestion: 'Switch to LED lighting' },
        { category: 'Water', potential: 200, suggestion: 'Fix leaking faucets' },
      ]
    };
  }

  async getSalesPerformance(isPremium: boolean) {
    if (!isPremium) {
      console.warn("Attempted to access premium sales performance insight without valid subscription.");
      return this.getDefaultSalesPerformance();
    }
    try {
      const insight = await db.insights
        .where('type')
        .equals(GoogleSheetsSyncService.INSIGHT_TYPES.SALES)
        .reverse()
        .first();

      if (!insight || this.isInsightStale(insight.timestamp)) {
        const transactions = await db.transactions
          .where('type')
          .equals('income')
          .toArray();
        
        const performance = this.analyzeSalesPerformance(transactions);
        
     
        return performance;
      }

      return insight.data;
    } catch (error) {
      console.error('Failed to get sales performance:', error);
      return this.getDefaultSalesPerformance();
    }
  }

  private analyzeSalesPerformance(transactions: any[]) {
    // Implement actual sales performance analysis logic here
    return this.getDefaultSalesPerformance();
  }

  private getDefaultSalesPerformance(): SalesPerformance {
    return {
      topProducts: [
        { name: 'Product A', revenue: 15000, growth: 0.25 },
        { name: 'Product B', revenue: 12000, growth: -0.1 },
      ],
      seasonalPerformance: {
        spring: { revenue: 45000, growth: 0.15 },
        summer: { revenue: 52000, growth: 0.2 },
      }
    };
  }

  async getFidelizationInsights(isPremium: boolean) {
    if (!isPremium) {
      console.warn("Attempted to access premium fidelization insight without valid subscription.");
      return this.getDefaultFidelization();
    }
    try {
      const insight = await db.insights
        .where('type')
        .equals(GoogleSheetsSyncService.INSIGHT_TYPES.FIDELIZATION)
        .reverse()
        .first();

      if (!insight || this.isInsightStale(insight.timestamp)) {
        const [transactions, people] = await Promise.all([
          db.transactions.where('type').equals('income').toArray(),
          db.persons.toArray()
        ]);
        
        const fidelization = this.analyzeFidelization(transactions, people);
        
        await db.insights.add({
          id: `fidelization-${new Date().getTime()}`,
          type: GoogleSheetsSyncService.INSIGHT_TYPES.FIDELIZATION,
          data: fidelization,
          timestamp: new Date().toISOString(),
          year: new Date().getFullYear(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        return fidelization;
      }

      return insight.data;
    } catch (error) {
      console.error('Failed to get fidelization insights:', error);
      return this.getDefaultFidelization();
    }
  }

  private analyzeFidelization(transactions: any[], people: any[]) {
    // Implement actual fidelization analysis logic here
    return this.getDefaultFidelization();
  }

  private getDefaultFidelization(): Fidelization {
    return {
      topCustomers: [
        { 
          name: 'John Doe',
          totalPurchases: 12500,
          frequentItems: ['Product A', 'Product B'],
          suggestedReward: 'Premium Product Sample'
        },
        {
          name: 'Jane Smith',
          totalPurchases: 9800,
          frequentItems: ['Product C', 'Product D'],
          suggestedReward: '10% Discount Coupon'
        }
      ],
      productPairs: [
        { products: ['Product A', 'Product B'], frequency: 0.75 },
        { products: ['Product C', 'Product D'], frequency: 0.65 }
      ]
    };
  }

  private isInsightStale(timestamp: string) {
    const STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours
    return Date.now() - new Date(timestamp).getTime() > STALE_THRESHOLD;
  }

  async syncWithGoogleSheets(year: number, isPremium: boolean): Promise<boolean> {
    if (!isPremium) {
      console.warn("Attempted to sync with Google Sheets without premium subscription.");
      return false;
    }
    if (appConfig.isDevelopment && appConfig.useMockData) {
      // Assuming mock data sync is fine for development even if not "premium"
      // Or, it could be gated too: return this.syncWithMockData(year, isPremium);
      return this.syncWithMockData(year); 
    }
    return this.syncYear(year, isPremium);
  }

  private async syncWithMockData(year: number): Promise<boolean> { // No isPremium here, gated by caller
    try {
      const mockSheet = dataMock.googleSheets.sheets.find(sheet => 
        sheet.name === `Dados ${year}`
      );

      if (!mockSheet) return false;

      await db.syncMetadata.put({
        id: `sync-${year}`,
        year,
        sheetId: mockSheet.id,
        lastSync: new Date().toISOString(),
        status: 'completed'
      });

      return true;
    } catch (error) {
      console.error('Erro na sincronização com mock:', error);
      return false;
    }
  }
}