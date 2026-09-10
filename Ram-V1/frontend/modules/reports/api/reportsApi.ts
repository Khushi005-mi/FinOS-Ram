import { apiClient } from "@/lib/api/axios";

export const reportsApi = {
  async getIncomeStatement(periodName?: string): Promise<any> {
    const params = periodName ? { period_name: periodName } : {};
    const response = await apiClient.get<any>("/reports/income-statement", { params });
    return (response.data && response.data.data) ? response.data.data : response.data;
  },

  async getBalanceSheet(periodName?: string): Promise<any> {
    const params = periodName ? { period_name: periodName } : {};
    const response = await apiClient.get<any>("/reports/balance-sheet", { params });
    return (response.data && response.data.data) ? response.data.data : response.data;
  },

  async getCashFlow(periodName?: string): Promise<any> {
    const params = periodName ? { period_name: periodName } : {};
    const response = await apiClient.get<any>("/reports/cash-flow", { params });
    return (response.data && response.data.data) ? response.data.data : response.data;
  },
};
