import { apiClient } from "@/lib/api/axios";

export async function submitBatch(files: File[], metadata: Array<Record<string, any>> = []) {
  if (!files || files.length === 0) {
    throw new Error("No file provided for batch ingestion. Please re-select your CSV file.");
  }

  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  formData.append("metadata", JSON.stringify(metadata));

  // The apiClient instance sets a default 'Content-Type: application/json' header.
  // We must override it to undefined here so axios auto-detects FormData
  // and generates the correct multipart boundary itself.
  const response = await apiClient.post("/ingestion/batch", formData, {
    headers: {
      "Content-Type": undefined,
    },
  });

  return response.data;
}

export const uploadApi = {
  submitBatch,
};
