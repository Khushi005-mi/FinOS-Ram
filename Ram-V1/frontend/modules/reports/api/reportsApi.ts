import { apiClient } from "@/lib/api/axios";
import { FinancialStatementPayload } from "../types/reportsTypes";

export const reportsApi = {
  async getIncomeStatement(periodName?: string): Promise<FinancialStatementPayload> {
    const response = await apiClient.get<FinancialStatementPayload>("/reports/income-statement", {
      params: { period: periodName },
    });
    return response.data;
  },

  async getBalanceSheet(periodName?: string): Promise<FinancialStatementPayload> {
    const response = await apiClient.get<FinancialStatementPayload>("/reports/balance-sheet", {
      params: { period: periodName },
    });
    return response.data;
  },

  async getCashFlow(periodName?: string): Promise<FinancialStatementPayload> {
    const response = await apiClient.get<FinancialStatementPayload>("/reports/cash-flow", {
      params: { period: periodName },
    });
    return response.data;
  },
};

export default reportsApi;
