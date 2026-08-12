// 1. Supported Data Source Types in FinOS V1
export type SourceType =
  | "GENERAL_LEDGER"      // Main Accounting Ledger (Tally / Zoho / QuickBooks)
  | "BANK_STATEMENT"      // Cash Inflows & Outflows
  | "RAW_MATERIALS_COGS"  // Inventory Purchase Invoices & Direct Material Costs
  | "PAYROLL_LABOR";      // Factory Wages & Direct Labor Expenses

// 2. Status of an Uploaded File in the Batch
export type FileStatus = "pending" | "parsing" | "mapped" | "error";

// 3. Represents a Single File inside the Batch
export interface UploadedFileItem {
  id: string; // Unique client-side ID
  file: File;
  name: string;
  size: number;
  sourceType: SourceType;
  status: FileStatus;
  detectedHeaders: string[]; // Headers read from Excel/CSV (e.g. ["Date", "Account", "Debit", "Credit"])
  columnMapping: Record<string, string>; // Maps User Header -> FinOS Standard Field
}

// 4. FinOS Standard Chart of Accounts (COA) Canonical Fields
export const FINOS_STANDARD_FIELDS = [
  { key: "transaction_date", label: "Transaction Date", required: true },
  { key: "account_code", label: "Account Code / ID", required: false },
  { key: "account_name", label: "Account Name / Category", required: true },
  { key: "debit", label: "Debit Amount ($)", required: false },
  { key: "credit", label: "Credit Amount ($)", required: false },
  { key: "amount", label: "Net Amount ($)", required: false },
  { key: "description", label: "Line Item Description", required: false },
  { key: "reference_id", label: "Invoice / Voucher Reference #", required: false },
] as const;

// 5. Ingestion Wizard Steps
export type UploadWizardStep = 1 | 2 | 3 | 4;