export type IndustryType =
  | "MANUFACTURING"
  | "ECOMMERCE_RETAIL"
  | "SERVICES_AGENCY"
  | "GENERAL_SMB";

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