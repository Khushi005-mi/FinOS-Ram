import { apiClient } from "@/lib/api/axios";
import { API_ROUTES } from "@/constants/apiRoutes";
import { UploadedFileItem } from "../types/uploadTypes";

export const uploadApi = {
  /**
   * Submits real user-uploaded binary files (.xlsx, .csv, .pdf) to FastAPI /api/v1/ingestion/batch.
   */
  async submitBatch(files: UploadedFileItem[]) {
    if (!files || files.length === 0) {
      throw new Error("Please attach at least one financial file to upload.");
    }

    const formData = new FormData();

    // 1. Append real binary files from browser memory
    files.forEach((item) => {
      formData.append("files", item.file);
    });

    // 2. Append column mapping JSON metadata
    const metadata = files.map((item) => ({
      fileName: item.name,
      sourceType: item.sourceType,
      columnMapping: item.columnMapping,
    }));
    formData.append("metadata", JSON.stringify(metadata));

    // 3. Stream multipart files over HTTP to FastAPI
    const response = await apiClient.post(API_ROUTES.INGESTION.BATCH, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  },
};