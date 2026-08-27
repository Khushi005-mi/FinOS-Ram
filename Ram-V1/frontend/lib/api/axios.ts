import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { env } from "@/config/env";
import { ApiErrorResponse } from "./types";

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    Accept: "application/json",
  },
});

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

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const message =
      (error.response?.data as any)?.detail ||
      (error.response?.data as any)?.message ||
      error.message ||
      "Network connection error.";

    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("finos_auth_token");
    }

    return Promise.reject(new Error(message));
  }
);

export default apiClient;
