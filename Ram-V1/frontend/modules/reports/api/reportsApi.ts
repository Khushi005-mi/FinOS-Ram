import { apiClient } from "@/lib/api/axios";
import { API_ROUTES } from "@/constants/apiRoutes";
import { FinancialStatementPayload } from "../types/reportsTypes";

export const reportsApi = {
  /**
   * Fetches the Income Statement (P&L) from FastAPI backend (/api/v1/reports/income-statement).
   */
  async getIncomeStatement(periodName: string = "Q1 2024 (Jan - Mar)"): Promise<FinancialStatementPayload> {
    try {
      const response = await apiClient.get<FinancialStatementPayload>(
        API_ROUTES.REPORTS.INCOME_STATEMENT,
        {
          params: { period_name: periodName },
        }
      );
      return response.data;
    } catch (error) {
      console.warn("⚠️ Backend offline/empty. Returning fallback report data...");
      return _getFallbackIncomeStatement(periodName);
    }
  },
};

function _getFallbackIncomeStatement(periodName: string): FinancialStatementPayload {
  return {
    organizationName: "Apex Manufacturing Ltd.",
    periodName: periodName,
    currency: "USD",
    revenue: [
      { id: "101", accountCode: "4000", accountName: "Product Manufacturing Revenue", amount: 1250000 },
      { id: "102", accountCode: "4100", accountName: "OEM Custom Contract Sales", amount: 200000 },
    ],
    costOfSales: [
      { id: "201", accountCode: "5000", accountName: "Direct Raw Material Consumption", amount: 480000 },
      { id: "202", accountCode: "5100", accountName: "Direct Factory Labor Payroll", amount: 220000 },
      { id: "203", accountCode: "5200", accountName: "Factory Equipment Depreciation & Utilities", amount: 120000 },
    ],
    operatingExpenses: [
      { id: "301", accountCode: "6000", accountName: "Executive & Admin Salaries", amount: 145000 },
      { id: "302", accountCode: "6100", accountName: "Sales, Logistics & Freight Expenses", amount: 85000 },
      { id: "303", accountCode: "6200", accountName: "Software & Technology Subscriptions", amount: 55000 },
    ],
    totalRevenue: 1450000,
    totalCostOfSales: 820000,
    grossProfit: 630000,
    totalOperatingExpenses: 285000,
    netIncome: 345000,
  };
}