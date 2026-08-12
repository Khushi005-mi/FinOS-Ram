/**
 * Formats an ISO date string into readable format (e.g., "2024-01-15" -> "Jan 15, 2024").
 */
export function formatDate(dateString: string): string {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }
  
  /**
   * Returns current fiscal quarter name (e.g., "Q1 2024").
   */
  export function getCurrentQuarter(): string {
    const date = new Date();
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    return `Q${quarter} ${date.getFullYear()}`;
  }