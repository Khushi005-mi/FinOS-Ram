import { apiClient } from "@/lib/api/axios";

export interface TransactionQueryParams {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export const dashboardApi = {
  async getMetrics() {
    const res = await apiClient.get("/dashboard/metrics");
    return res.data;
  },

  async getMonthlyTrends() {
    const res = await apiClient.get("/dashboard/trends");
    return res.data;
  },

  async getCostBreakdown() {
    const res = await apiClient.get("/analytics/cogs");
    return res.data;
  },

  async getInsights() {
    const res = await apiClient.get("/analytics/insights");
    return res.data;
  },

  async getBatches() {
    const res = await apiClient.get("/ingestion/batches");
    return res.data;
  },

  async activateBatch(batchId: string) {
    const res = await apiClient.post(`/ingestion/batches/${batchId}/activate`);
    return res.data;
  },

  async getTransactions(params?: TransactionQueryParams) {
    const res = await apiClient.get("/dashboard/transactions", { params });
    return res.data;
  },
};

export default dashboardApi;
