const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
  CAD: "CA$",
  AUD: "A$",
  JPY: "¥",
};

/**
 * Formats any raw numeric amount dynamically with the tenant's currency symbol.
 * Example: formatCurrency(1450000, "INR") -> "₹1,450,000"
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = "INR",
  compact: boolean = false
): string {
  const symbol = CURRENCY_SYMBOLS[currencyCode.toUpperCase()] || "₹";
  const num = Number(amount) || 0;

  if (compact) {
    if (Math.abs(num) >= 10000000) {
      return `${symbol}${(num / 10000000).toFixed(1)}Cr`; // Indian Crore format
    }
    if (Math.abs(num) >= 100000) {
      return `${symbol}${(num / 100000).toFixed(1)}L`; // Indian Lakh format
    }
    if (Math.abs(num) >= 1000) {
      return `${symbol}${(num / 1000).toFixed(0)}k`;
    }
    return `${symbol}${num.toFixed(0)}`;
  }

  return `${symbol}${Math.round(num).toLocaleString("en-IN")}`;
}