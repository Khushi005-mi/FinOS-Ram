import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { env } from "@/config/env";
import { ApiErrorResponse } from "./types";

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
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
      error.response?.data?.message ||
      error.message ||
      "An unexpected network error occurred. Please check if backend is running on port 8000.";

    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("finos_auth_token");
    }

    // Always reject with a real Error instance so Next.js prints clean error text
    return Promise.reject(new Error(message));
  }
);