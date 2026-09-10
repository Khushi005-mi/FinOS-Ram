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
   * Fetches real summary financial metrics from FastAPI backend.
   * Unwraps the production { success, data, error } envelope.
   */
  async getMetrics(): Promise<DashboardMetrics> {
    const response = await apiClient.get<any>(API_ROUTES.DASHBOARD.METRICS);
    const raw = response.data;
    // Handle both enveloped { data: ... } and direct payloads
    const payload = (raw && typeof raw === "object" && "data" in raw && raw.data) ? raw.data : raw;
    return payload as DashboardMetrics;
  },

  /**
   * Fetches real monthly trend points from FastAPI backend.
   */
  async getMonthlyTrends(): Promise<MonthlyTrendPoint[]> {
    const response = await apiClient.get<any>(API_ROUTES.DASHBOARD.TRENDS);
    const raw = response.data;
    const payload = (raw && typeof raw === "object" && "data" in raw && Array.isArray(raw.data)) ? raw.data : (Array.isArray(raw) ? raw : []);
    return payload as MonthlyTrendPoint[];
  },

  /**
   * Fetches real COGS cost breakdown from FastAPI backend.
   */
  async getCostBreakdown(): Promise<UniversalCostBreakdown> {
    const response = await apiClient.get<any>(API_ROUTES.ANALYTICS.COGS);
    const raw = response.data;
    const payload = (raw && typeof raw === "object" && "data" in raw && raw.data) ? raw.data : raw;
    return payload as UniversalCostBreakdown;
  },

  /**
   * Fetches real CFO decision recommendations from FastAPI backend.
   */
  async getInsights(): Promise<ExecutiveInsight[]> {
    const response = await apiClient.get<any>(API_ROUTES.ANALYTICS.INSIGHTS);
    const raw = response.data;
    const payload = (raw && typeof raw === "object" && "data" in raw && Array.isArray(raw.data)) ? raw.data : (Array.isArray(raw) ? raw : []);
    return payload as ExecutiveInsight[];
  },
};
