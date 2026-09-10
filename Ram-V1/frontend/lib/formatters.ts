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

const CURRENCY_LOCALES: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  AED: "en-AE",
  CAD: "en-CA",
  AUD: "en-AU",
  JPY: "ja-JP",
};

/**
 * Formats numeric amounts dynamically using true internationalization.
 * USD -> $3,000,000 or $3.0M
 * INR -> ₹30,00,000 or ₹30.0L / ₹3.0Cr
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = "USD",
  compact: boolean = false
): string {
  const code = (currencyCode || "USD").toUpperCase();
  const symbol = CURRENCY_SYMBOLS[code] || "$";
  const locale = CURRENCY_LOCALES[code] || "en-US";
  const num = Number(amount) || 0;

  if (compact) {
    // Indian South Asian numbering system
    if (code === "INR") {
      if (Math.abs(num) >= 10000000) {
        return `${symbol}${(num / 10000000).toFixed(1)}Cr`;
      }
      if (Math.abs(num) >= 100000) {
        return `${symbol}${(num / 100000).toFixed(1)}L`;
      }
      if (Math.abs(num) >= 1000) {
        return `${symbol}${(num / 1000).toFixed(0)}k`;
      }
      return `${symbol}${num.toFixed(0)}`;
    }

    // Western Millions / Billions numbering system (USD, EUR, GBP, etc.)
    if (Math.abs(num) >= 1000000000) {
      return `${symbol}${(num / 1000000000).toFixed(1)}B`;
    }
    if (Math.abs(num) >= 1000000) {
      return `${symbol}${(num / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(num) >= 1000) {
      return `${symbol}${(num / 1000).toFixed(0)}k`;
    }
    return `${symbol}${num.toFixed(0)}`;
  }

  // Full currency display with localized comma grouping
  try {
    return `${symbol}${Math.round(num).toLocaleString(locale)}`;
  } catch {
    return `${symbol}${Math.round(num).toLocaleString("en-US")}`;
  }
}
