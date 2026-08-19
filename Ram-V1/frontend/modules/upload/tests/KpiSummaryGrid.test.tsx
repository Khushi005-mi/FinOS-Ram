// frontend/modules/dashboard/__tests__/KpiSummaryGrid.test.tsx
import { render, screen } from "@testing-library/react";
import { KpiSummaryGrid } from "../components/KpiSummaryGrid";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

test("does not show fallback ₹88,50,000 on network error", async () => {
  server.use(
    http.get("/api/v1/dashboard/metrics", () => {
      return HttpResponse.json({ message: "Network error" }, { status: 500 });
    })
  );

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <KpiSummaryGrid />
    </QueryClientProvider>
  );

  // Assert error message appears instead of static mock revenue
expect(await screen.findByText(/failed to load metrics/i)).toBeInTheDocument();
expect(screen.queryByText(/88,50,000/)).not.toBeInTheDocument();
});