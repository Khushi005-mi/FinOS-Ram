import { apiClient } from "@/lib/api/axios";
import { API_ROUTES } from "@/constants/apiRoutes";
import { FinancialStatementPayload } from "../types/reportsTypes";

export const reportsApi = {
  /**
   * Fetches 100% live Income Statement (P&L) calculated by FastAPI from database entries.
   */
  async getIncomeStatement(periodName: string = "Q1 2024 (Jan - Mar)"): Promise<FinancialStatementPayload> {
    const response = await apiClient.get<FinancialStatementPayload>(
      API_ROUTES.REPORTS.INCOME_STATEMENT,
      {
        params: { period_name: periodName },
      }
    );
    return response.data;
  },
};