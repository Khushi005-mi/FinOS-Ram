/**
 * Centralized API Route Paths matching FastAPI Backend Endpoints (/api/v1)
 */
export const API_ROUTES = {
    AUTH: {
      LOGIN: "/auth/login",
      SIGNUP: "/auth/signup",
      ME: "/auth/me",
    },
    INGESTION: {
      BATCH: "/ingestion/batch",
    },
    DASHBOARD: {
      METRICS: "/dashboard/metrics",
      TRENDS: "/dashboard/trends",
    },
    ANALYTICS: {
      COGS: "/analytics/cogs",
      INSIGHTS: "/analytics/insights",
    },
    REPORTS: {
      INCOME_STATEMENT: "/reports/income-statement",
    },
  } as const;