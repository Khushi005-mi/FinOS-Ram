import { apiClient } from "@/lib/api/axios";

export async function submitBatch(payload: any) {
  const formData = new FormData();
  let fileObj: any = null;

  // Universal deep file extractor
  if (payload instanceof FormData) {
    fileObj = payload.get('files') || payload.get('file');
  } else if (payload instanceof File || payload instanceof Blob) {
    fileObj = payload;
  } else if (payload instanceof FileList && payload.length > 0) {
    fileObj = payload[0];
  } else if (Array.isArray(payload) && payload.length > 0) {
    fileObj = payload[0];
  } else if (payload && typeof payload === 'object') {
    // Check common properties or look inside nested objects/mapping structures
    fileObj = 
      payload.file || 
      payload.files || 
      payload.data || 
      payload.rawFile ||
      payload.selectedFile;

    // If payload is the column mapper state containing a file property
    if (!fileObj) {
      for (const key of Object.keys(payload)) {
        if (payload[key] instanceof File || payload[key] instanceof Blob) {
          fileObj = payload[key];
          break;
        }
      }
    }
  }

  if (!fileObj) {
    console.error("[FINOS INGESTION] Unrecognized payload structure passed to submitBatch:", payload);
    throw new Error("No valid file object found for batch ingestion. Please re-select your CSV file.");
  }

  // Append with key 'files' as demanded by FastAPI signature List[UploadFile]
  formData.append('files', fileObj);

  const response = await apiClient.post("/ingestion/batch", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export const uploadApi = {
  submitBatch,
};
