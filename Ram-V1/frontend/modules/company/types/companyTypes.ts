export interface CountryOption {
    countryCode: string;
    countryName: string;
    currencyCode: string;
    currencySymbol: string;
    defaultFiscalYearStart: number; // Month number (1 = Jan, 4 = Apr, 7 = Jul)
  }
  
  export const SUPPORTED_COUNTRIES: CountryOption[] = [
    { countryCode: "IN", countryName: "India", currencyCode: "INR", currencySymbol: "₹", defaultFiscalYearStart: 4 },
    { countryCode: "US", countryName: "United States", currencyCode: "USD", currencySymbol: "$", defaultFiscalYearStart: 1 },
    { countryCode: "GB", countryName: "United Kingdom", currencyCode: "GBP", currencySymbol: "£", defaultFiscalYearStart: 4 },
    { countryCode: "EU", countryName: "European Union", currencyCode: "EUR", currencySymbol: "€", defaultFiscalYearStart: 1 },
    { countryCode: "AE", countryName: "United Arab Emirates", currencyCode: "AED", currencySymbol: "AED ", defaultFiscalYearStart: 1 },
    { countryCode: "CA", countryName: "Canada", currencyCode: "CAD", currencySymbol: "CA$", defaultFiscalYearStart: 1 },
    { countryCode: "AU", countryName: "Australia", currencyCode: "AUD", currencySymbol: "A$", defaultFiscalYearStart: 7 },
    { countryCode: "JP", countryName: "Japan", currencyCode: "JPY", currencySymbol: "¥", defaultFiscalYearStart: 4 },
  ];
  
  export interface OrganizationProfile {
    id: string;
    name: string;
    slug: string;
    industryType: string;
    currency: string;
    fiscalYearStart: number;
  }