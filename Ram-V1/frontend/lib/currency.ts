/**
 * FinOS Multi-Currency Engine
 * Instant conversion and formatting across major global currencies.
 */

export type SupportedCurrency = "INR" | "USD" | "EUR" | "GBP" | "AED";

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
};

// Base baseline exchange rates relative to INR
export const EXCHANGE_RATES: Record<SupportedCurrency, number> = {
  INR: 1.0,
  USD: 0.012,    // $1 = ~₹83.3
  EUR: 0.011,    // €1 = ~₹90.9
  GBP: 0.0095,   // £1 = ~₹105.2
  AED: 0.044,    // 1 AED = ~₹22.7
};

export function formatFinancialValue(
  amountInBaseInr: number,
  targetCurrency: SupportedCurrency = "INR"
): string {
  const symbol = CURRENCY_SYMBOLS[targetCurrency] || "₹";
  const rate = EXCHANGE_RATES[targetCurrency] || 1.0;
  const converted = amountInBaseInr * rate;

  const isNegative = converted < 0;
  const absVal = Math.abs(converted);

  let formattedNum = "";
  if (targetCurrency === "INR") {
    formattedNum = absVal.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    });
  } else {
    formattedNum = absVal.toLocaleString("en-US", {
      maximumFractionDigits: 0,
    });
  }

  return isNegative ? `-${symbol}${formattedNum}` : `${symbol}${formattedNum}`;
}
