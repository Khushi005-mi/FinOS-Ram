import { apiClient } from "@/lib/api/axios";
import { API_ROUTES } from "@/constants/apiRoutes";
import {
  DashboardMetrics,
  MonthlyTrendPoint,
  UniversalCostBreakdown,
  ExecutiveInsight,
} from "../types/dashboardTypes";

export const dashboardApi = {
  /**
   * Fetches real summary financial metrics for active_batch_id from FastAPI backend.
   */
  async getMetrics(): Promise<DashboardMetrics> {
    try {
      const response = await apiClient.get<DashboardMetrics>(API_ROUTES.DASHBOARD.METRICS);
      
      // 📸 CAMERA 5: WHAT DOES THE FRONTEND RECEIVE?
      console.log("\n[FINOS TRACE 5] DASHBOARD API SUCCESS");
      console.log("Real Data from Backend:", response.data);
      
      return response.data;
    } catch (error) {
      // 📸 CAMERA 6: IS THE FRONTEND FAKING AN ERROR?
      console.error("\n[FINOS TRACE 6] DASHBOARD API FAILED!");
      console.error("Error details:", error);
      throw error;
    }
  },

  /**
   * Fetches real monthly trend points for active_batch_id from FastAPI backend.
   */
  async getMonthlyTrends(): Promise<MonthlyTrendPoint[]> {
    const response = await apiClient.get<MonthlyTrendPoint[]>(API_ROUTES.DASHBOARD.TRENDS);
    return response.data;
  },

  /**
   * Fetches real COGS cost breakdown for active_batch_id from FastAPI backend.
   */
  async getCostBreakdown(): Promise<UniversalCostBreakdown> {
    const response = await apiClient.get<UniversalCostBreakdown>(API_ROUTES.ANALYTICS.COGS);
    return response.data;
  },

  /**
   * Fetches real CFO decision recommendations for active_batch_id from FastAPI backend.
   */
  async getInsights(): Promise<ExecutiveInsight[]> {
    const response = await apiClient.get<ExecutiveInsight[]>(API_ROUTES.ANALYTICS.INSIGHTS);
    return response.data;
  },
};