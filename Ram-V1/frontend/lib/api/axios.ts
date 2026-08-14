import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { env } from "@/config/env";
import { ApiErrorResponse } from "./types";

// 1. Create Central Axios Instance
export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  timeout: 30000, // 30 second timeout for large file processing
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// 2. Request Interceptor: Auto-Inject Bearer JWT Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("finos_auth_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response Interceptor: Global Error Handling & 401 Session Cleanup
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "An unexpected network error occurred. Please check if backend is running on port 8000.";

    if (error.response?.status === 401 && typeof window !== "undefined") {
      console.warn("🔒 Session expired or unauthorized. Clearing token...");
      localStorage.removeItem("finos_auth_token");
    }

    // Always reject with a real Error instance for clean UI rendering
    return Promise.reject(new Error(message));
  }
);