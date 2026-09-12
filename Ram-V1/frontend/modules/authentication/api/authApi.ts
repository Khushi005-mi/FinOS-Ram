import { apiClient } from "@/lib/api/axios";
import { LoginInput, SignupInput } from "../schemas/authSchemas";

export interface AuthResponse {
  access_token?: string;
  token_type?: string;
  success?: boolean;
  data?: {
    access_token?: string;
    [key: string]: any;
  };
}

export const authApi = {
  async login(credentials: LoginInput): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", {
      email: credentials.email,
      password: credentials.password,
    });
    const resData = response.data;
    const token = resData?.access_token || resData?.data?.access_token;
    if (typeof window !== "undefined" && token) {
      localStorage.setItem("access_token", token);
      localStorage.setItem("token", token);
    }
    return resData;
  },

  async signup(input: SignupInput): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/signup", {
      email: input.email,
      password: input.password,
      full_name: input.fullName,
      company_name: input.companyName,
      currency: input.currency || "USD",
    });
    const resData = response.data;
    const token = resData?.access_token || resData?.data?.access_token;
    if (typeof window !== "undefined" && token) {
      localStorage.setItem("access_token", token);
      localStorage.setItem("token", token);
    }
    return resData;
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string; reset_token?: string }> {
    const response = await apiClient.post("/auth/forgot-password", { email });
    return response.data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post("/auth/reset-password", {
      token,
      new_password: newPassword,
    });
    return response.data;
  },

  async logout() {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // ignore
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("access_token");
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
  },
};
