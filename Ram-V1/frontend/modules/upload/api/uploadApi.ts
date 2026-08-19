import { apiClient } from "@/lib/api/axios";

export const submitBatch = async (files: File[], organizationId: string) => {
  try {
    // 📸 CAMERA 1: Right before sending to backend
    console.log("[FINOS TRACE 1] FRONTEND PRE-UPLOAD");
    console.log("filename =", files[0]?.name); 
    console.log("file.size =", files[0]?.size);

    const formData = new FormData();
    files.forEach(file => formData.append("files", file));
    
    // Backend expects metadata as a form field
    formData.append("metadata", "[]"); 

    // EXACT FIX: Tell apiClient this is a file upload, not JSON
    const response = await apiClient.post('/ingestion/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }); 

    // 📸 CAMERA 2: Right after the backend replies
    console.log("[FINOS TRACE 2] FRONTEND POST-UPLOAD");
    console.log("upload response =", response.data);

    return response.data;
    
  } catch (error: any) {
    console.error("\n[FINOS TRACE ERROR] Upload Failed");
    throw error;
  }
};