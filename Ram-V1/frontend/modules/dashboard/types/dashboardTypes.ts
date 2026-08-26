export type IndustryType =
  | "MANUFACTURING"
  | "ECOMMERCE_RETAIL"
  | "SERVICES_AGENCY"
  | "GENERAL_SMB";

export interface KpiMetric {
  title: string;
  value: string;
  changePercentage: number;
  trend: "up" | "down" | "neutral";
  isPositive: boolean;
  description: string;
}

// THIS WAS MISSING
export interface DashboardMetrics {
  revenue: KpiMetric;
  cogs: KpiMetric;
  grossMargin: KpiMetric;
  ebitda: KpiMetric;
}

export interface MonthlyTrendPoint {
  month: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  operatingMargin: number;
}

export interface CostBucket {
  label: string;
  amount: number;
  percentage: string;
  color: string;
}

export interface UniversalCostBreakdown {
  industryType: IndustryType;
  totalCost: number;
  buckets: CostBucket[];
}

export interface ExecutiveInsight {
  id: string;
  type: "positive" | "warning" | "info";
  title: string;
  summary: string;
}