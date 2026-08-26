import { apiClient } from "@/lib/api/axios";

export const submitBatch = async (files: File[], organizationId?: string) => {
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("metadata", "[]");

    const response = await apiClient.post("/ingestion/batch", formData, {
      headers: {
        "Content-Type": undefined,
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("[FINOS ERROR] Upload Failed:", error);
    throw error;
  }
};

export const uploadApi = {
  submitBatch,
};

export default uploadApi;
