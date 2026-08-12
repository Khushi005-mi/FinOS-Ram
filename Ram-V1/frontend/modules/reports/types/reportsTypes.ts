// Single line item in a financial statement
export interface StatementLineItem {
    id: string;
    accountCode?: string;
    accountName: string;
    amount: number;
    isHeader?: boolean;
    isTotal?: boolean;
    children?: StatementLineItem[];
  }
  
  // Complete Financial Statement Payload
  export interface FinancialStatementPayload {
    organizationName: string;
    periodName: string; // e.g. "Q1 2024" or "FY 2023-2024"
    currency: string;   // e.g. "USD"
    revenue: StatementLineItem[];
    costOfSales: StatementLineItem[];
    operatingExpenses: StatementLineItem[];
    totalRevenue: number;
    totalCostOfSales: number;
    grossProfit: number;
    totalOperatingExpenses: number;
    netIncome: number;
  }