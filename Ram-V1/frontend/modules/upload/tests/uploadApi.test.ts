// frontend/modules/upload/__tests__/uploadApi.test.ts
import { submitBatch } from "../api/uploadApi";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";

describe("uploadApi - submitBatch", () => {
  it("throws error and does NOT trigger demo fallback when API returns 500", async () => {
    let demoBatchCalled = false;

    server.use(
      http.post("/api/v1/ingestion/batch", () => {
        return HttpResponse.json({ detail: "Server Ingestion Error" }, { status: 500 });
      }),
      http.post("/api/v1/ingestion/demo-batch", () => {
        demoBatchCalled = true;
        return HttpResponse.json({ success: true });
      })
    );

    const file = new File(["dummy content"], "test.csv", { type: "text/csv" });

    await expect(submitBatch([file])).rejects.toThrow();
    expect(demoBatchCalled).toBe(false); // Proves silent demo fallback was removed
  });
});