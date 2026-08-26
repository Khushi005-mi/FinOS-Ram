"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, ReactNode } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // We use useState to ensure QueryClient is initialized ONCE per client session in Next.js
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is fresh for 1 minute before considered stale
            staleTime: 60 * 1000,
            // Cache data in memory for 5 minutes
            gcTime: 5 * 60 * 1000,
            // Disable automatic refetch when switching browser tabs (saves unnecessary server load)
            refetchOnWindowFocus: false,
            // Retry failed requests 1 time before throwing an error
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}