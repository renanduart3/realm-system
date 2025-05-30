import { db } from '../db/AppDatabase';
import { InsightData } from '../model/types';

export const insightsService = {
  async getInsights(): Promise<InsightData | null> {
    try {
      // Fetch all insights data from the database
      const insights = await db.insights.toArray();

      // Initialize the structure for InsightData
      const insightData: InsightData = {
        demandPrediction: null,
        customerSentiment: null,
        expenseAnalysis: { topExpenses: [] },
        salesPerformance: null,
        fidelization: null,
      };

      // Aggregate insights based on their type
      insights.forEach(insight => {
        switch (insight.type) {
          case 'demand_prediction':
            insightData.demandPrediction = insight.data;
            break;
          case 'customer_sentiment':
            insightData.customerSentiment = insight.data;
            break;
          case 'expense_analysis':
            insightData.expenseAnalysis = insight.data;
            break;
          case 'sales_performance':
            insightData.salesPerformance = insight.data;
            break;
          case 'fidelization':
            insightData.fidelization = insight.data;
            break;
        }
      });

      return insightData;
    } catch (error) {
      console.error("Error fetching insights data", error);
      return null;
    }
  }
};

export default insightsService;
