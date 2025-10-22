import { INSIGHT_TYPES } from '../db/constants';
import { getDbEngine } from '../db/engine';
import { InsightData } from '../model/types';

export const insightsService = {
  async getInsights(): Promise<InsightData | null> {
    console.log('🔍 insightsService.getInsights called');
    try {
      console.log('📡 Fetching insights from database...');
      const engine = getDbEngine();
      const insights = await engine.listInsights();
      console.log('📊 Raw insights from DB:', insights);

      // Initialize the structure for InsightData with all possible fields
      const insightData: InsightData = {
        demandPrediction: null,
        customerSentiment: null,
        expenseAnalysis: { topExpenses: [], savingsOpportunities: [] },
        salesPerformance: null,
        fidelization: null,
        programImpact: null,
        donorEngagement: null
      };

      // Aggregate insights based on their type
      insights.forEach(insight => {
        switch (insight.type) {
          case INSIGHT_TYPES.DEMAND:
            insightData.demandPrediction = insight.data;
            break;
          case INSIGHT_TYPES.SENTIMENT:
            insightData.customerSentiment = insight.data;
            break;
          case INSIGHT_TYPES.EXPENSE:
            insightData.expenseAnalysis = insight.data;
            break;
          case INSIGHT_TYPES.SALES:
            insightData.salesPerformance = insight.data;
            break;
          case INSIGHT_TYPES.FIDELIZATION:
            insightData.fidelization = insight.data;
            break;
          case INSIGHT_TYPES.PROGRAM_IMPACT:
            insightData.programImpact = insight.data;
            break;
          case INSIGHT_TYPES.DONOR_ENGAGEMENT:
            insightData.donorEngagement = insight.data;
            break;
        }
      });

      console.log('📊 Final insightData:', insightData);
      return insightData;
    } catch (error) {
      console.error("❌ Error fetching insights data:", error);
      return null;
    }
  }
};

export default insightsService;


