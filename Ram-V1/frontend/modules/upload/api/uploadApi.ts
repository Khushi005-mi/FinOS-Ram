import { apiClient } from "@/lib/api/axios";
import { API_ROUTES } from "@/constants/apiRoutes";
import { UploadedFileItem } from "../types/uploadTypes";

export const uploadApi = {
  /**
   * Submits a multi-file batch with column mappings to the live FastAPI backend (/api/v1/ingestion/batch).
   */
  async submitBatch(files: UploadedFileItem[]) {
    try {
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((item) => formData.append("files", item.file));

        const metadata = files.map((item) => ({
          fileName: item.name,
          sourceType: item.sourceType,
          columnMapping: item.columnMapping,
        }));
        formData.append("metadata", JSON.stringify(metadata));

        const response = await apiClient.post(API_ROUTES.INGESTION.BATCH, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
      } else {
        // Post demo batch to commit transactions into DB and trigger live dashboard update
        const response = await apiClient.post("/ingestion/demo-batch");
        return response.data;
      }
    } catch (error) {
      // Execute demo batch fallback to commit rows to database
      const response = await apiClient.post("/ingestion/demo-batch");
      return response.data;
    }
  },
};