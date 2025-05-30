import { appConfig } from '../config/app.config';
import { db, INSIGHT_TYPES, Insight as DbInsightEntry } from '../db/AppDatabase';
import {
  InsightData,
  DemandPrediction,
  CustomerSentiment,
  ExpenseAnalysis,
  SalesPerformance,
  Fidelization,
  ProgramImpact,
  DonorEngagement,
} from '../model/types';

export class GoogleSheetsSyncService {
  private static readonly INSIGHT_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    // Constructor can be used for API client initialization in a real app
  }

  private isInsightStale(timestamp: string | number): boolean {
    const insightTime = new Date(timestamp).getTime();
    const currentTime = new Date().getTime();
    return currentTime - insightTime > GoogleSheetsSyncService.INSIGHT_EXPIRATION_MS;
  }

  // --- Generic Private Method to Get and Cache Insights ---
  private async getAndCacheInsight<T extends DemandPrediction | CustomerSentiment | ExpenseAnalysis | SalesPerformance | Fidelization | ProgramImpact | DonorEngagement>(
    insightType: typeof INSIGHT_TYPES[keyof typeof INSIGHT_TYPES],
    defaultGetter: () => T,
    isPremium: boolean // Added isPremium
  ): Promise<T | null> {
    // If not premium, don't even attempt to fetch/generate a new insight, return null.
    // Specific getters can decide to return default data for non-premium users if needed before calling this.
    if (!isPremium) {
      console.warn(`Attempted to access premium insight (${insightType}) without subscription.`);
      return null;
    }

    try {
      const insight = await db.insights.where('type').equals(insightType).reverse().first();
      if (!insight || this.isInsightStale(insight.timestamp)) {
        console.log(`Generating new insight for ${insightType} (stale or missing for premium user)`);
        const data = defaultGetter();
        if (data) {
            await db.insights.put({
            id: `${insightType}-${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`, 
            type: insightType,
            data,
            timestamp: new Date().toISOString(),
            year: new Date().getFullYear(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            } as DbInsightEntry);
        }
        return data;
      }
      return insight.data as T;
    } catch (error) {
      console.error(`Failed to get insight ${insightType}:`, error);
      return defaultGetter(); // Fallback to default on error
    }
  }
  
  // --- Default Mock Data Getters for Non-Profit ---
  private getDefaultProgramImpact(): ProgramImpact {
    return {
      programs: [
        { name: 'Community Workshop Series', beneficiariesReached: 250, outcomeMetric: 'Skills Acquired: 80% participants report new skills' },
        { name: 'Youth Mentorship Program', beneficiariesReached: 75, outcomeMetric: 'Graduation Rate: 90%' },
      ],
      overallImpactScore: 0.88,
    };
  }

  private getDefaultDonorEngagement(): DonorEngagement {
    return {
      activeDonors: 120,
      donationFrequency: 3.1, 
      averageDonationAmount: 85,
      topDonors: [
        { name: 'Generous Foundation', totalDonated: 15000, lastDonationDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() }, 
        { name: 'Anonymous Benefactor', totalDonated: 10000, lastDonationDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() }, 
      ],
    };
  }

  // --- Public Async Insight Getters for Non-Profit ---
  async getProgramImpact(isPremium: boolean): Promise<ProgramImpact | null> {
    return this.getAndCacheInsight(INSIGHT_TYPES.PROGRAM_IMPACT, this.getDefaultProgramImpact.bind(this), isPremium);
  }

  async getDonorEngagement(isPremium: boolean): Promise<DonorEngagement | null> {
    return this.getAndCacheInsight(INSIGHT_TYPES.DONOR_ENGAGEMENT, this.getDefaultDonorEngagement.bind(this), isPremium);
  }

  
  // --- Default Mock Data Getters for Profit-Oriented Insights ---
  private getDefaultDemandPrediction(): DemandPrediction {
    return {
      topProducts: [
        { name: 'Premium Widget', predictedDemand: 120, trend: 'up', confidence: 0.85 },
        { name: 'Standard Gadget', predictedDemand: 200, trend: 'down', confidence: 0.9 },
      ],
      seasonalTrends: { 'Holiday Season': ['Premium Widget', 'Gift Bundle'] }
    };
  }

  private getDefaultCustomerSentiment(): CustomerSentiment {
    return {
      overallSentiment: 0.78, 
      recentTrend: 'positive',
      topComplaints: ['Shipping delays', 'Price increase'],
      topPraises: ['Excellent quality', 'Helpful support team'],
      recentReviews: ['Love the new features!', 'Customer service was outstanding.'],
    };
  }
  
  private getDefaultExpenseAnalysis(): ExpenseAnalysis { // Common for both
    return {
      topExpenses: [
        { category: 'Operational Costs', amount: 12000, trend: 'down' },
        { category: 'Marketing Campaigns', amount: 7500, trend: 'up' },
      ],
      savingsOpportunities: ['Renegotiate supplier contracts', 'Optimize cloud spending']
    };
  }

  private getDefaultSalesPerformance(): SalesPerformance {
    return {
      topProducts: [
        { name: 'Premium Widget', revenue: 25000, growth: 0.12, date: new Date().toISOString() },
        { name: 'Standard Gadget', revenue: 18000, growth: 0.05, date: new Date().toISOString() },
      ],
      seasonalPerformance: { 'Last Quarter': { revenue: 50000, growth: 0.08 } }
    };
  }

  private getDefaultFidelization(): Fidelization {
    return {
      topCustomers: [
        { name: 'Loyal Client Corp', totalPurchases: 7500, frequentItems: ['Premium Widget', 'Service Plan'], suggestedReward: 'Early access to new products' },
      ],
      productPairs: ['Premium Widget', 'Extended Warranty']
    };
  }

  // --- Public Async Insight Getters for Profit-Oriented Insights ---
  async getDemandPrediction(isPremium: boolean): Promise<DemandPrediction | null> {
    return this.getAndCacheInsight(INSIGHT_TYPES.DEMAND, this.getDefaultDemandPrediction.bind(this), isPremium);
  }

  async getCustomerSentiment(isPremium: boolean): Promise<CustomerSentiment | null> {
    return this.getAndCacheInsight(INSIGHT_TYPES.SENTIMENT, this.getDefaultCustomerSentiment.bind(this), isPremium);
  }

  async getExpenseAnalysis(isPremium: boolean): Promise<ExpenseAnalysis> {
    // ExpenseAnalysis is special: non-premium users get default data, premium users get potentially calculated data.
    if (!isPremium) {
      console.warn("Attempted to access premium expense analysis insight without valid subscription. Returning default data.");
      return this.getDefaultExpenseAnalysis();
    }
    // For premium users, proceed with potential calculation via getAndCacheInsight
    const data = await this.getAndCacheInsight(INSIGHT_TYPES.EXPENSE, this.getDefaultExpenseAnalysis.bind(this), true); // Pass true for isPremium
    return data || this.getDefaultExpenseAnalysis(); // Ensure it always returns a valid object
  }

  async getSalesPerformance(isPremium: boolean): Promise<SalesPerformance | null> {
    return this.getAndCacheInsight(INSIGHT_TYPES.SALES, this.getDefaultSalesPerformance.bind(this), isPremium);
  }

  async getFidelizationInsights(isPremium: boolean): Promise<Fidelization | null> {
    return this.getAndCacheInsight(INSIGHT_TYPES.FIDELIZATION, this.getDefaultFidelization.bind(this), isPremium);
  }
  
  // --- Main Insight Generation Method ---
  async generateInsights(isProfit: boolean, year: number, isPremium: boolean): Promise<InsightData> {
    // 'year' param can be used in real data fetching logic if needed
    const expenseAnalysis = await this.getExpenseAnalysis(isPremium); // Common, but respects premium for calculation

    if (isProfit) {
      return {
        demandPrediction: await this.getDemandPrediction(isPremium),
        customerSentiment: await this.getCustomerSentiment(isPremium),
        expenseAnalysis, // Already respects isPremium
        salesPerformance: await this.getSalesPerformance(isPremium),
        fidelization: await this.getFidelizationInsights(isPremium),
        programImpact: null, // Explicitly null for profit
        donorEngagement: null, // Explicitly null for profit
      };
    } else { // Non-profit
      return {
        demandPrediction: null, 
        customerSentiment: null, 
        expenseAnalysis, // Already respects isPremium
        salesPerformance: null, 
        fidelization: null, 
        programImpact: await this.getProgramImpact(isPremium),
        donorEngagement: await this.getDonorEngagement(isPremium),
      };
    }
  }


  async exportDataToGoogleSheets(isPremium: boolean): Promise<{ success: boolean, message: string }> {
    if (!isPremium) {
      console.warn("Attempted to export to Google Sheets without premium subscription.");
      return { success: false, message: 'This is a premium feature. Please upgrade your subscription.' };
    }

    if (appConfig.useMockData) {
      console.log('Mocking Google Sheets export success.');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: 'Dados sincronizados com Google Sheets (Mock Mode)!' };
    }

    try {
      const response = await fetch('/api/export-to-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Falha na exportação');
      return { success: true, message: 'Dados exportados com sucesso!' };
    } catch (error: any) {
      console.error('Erro na exportação:', error);
      return { success: false, message: error.message || 'Erro desconhecido na exportação.' };
    }
  }
}

export const googleSheetsSyncService = new GoogleSheetsSyncService();