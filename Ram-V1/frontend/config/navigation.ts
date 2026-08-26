export interface NavigationItem {
    label: string;
    href: string;
    description?: string;
  }
  
  export const MAIN_NAVIGATION: NavigationItem[] = [
    {
      label: "Executive Dashboard",
      href: "/dashboard",
      description: "Real-time revenue, margins, and diagnostic insights",
    },
    {
      label: "Data Ingestion & Upload",
      href: "/upload",
      description: "Multi-file batch upload and column mapping engine",
    },
    {
      label: "Financial Statements",
      href: "/reports",
      description: "Income Statement (P&L), Balance Sheet, and Export tools",
    },
    {
      label: "Company Profile",
      href: "/company",
      description: "Organization profile, currency, and business industry settings",
    },
    {
      label: "Settings",
      href: "/settings",
      description: "User profile, security, and integration keys",
    },
  ];