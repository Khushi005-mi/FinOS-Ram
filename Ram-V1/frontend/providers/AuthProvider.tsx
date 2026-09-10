"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "@/lib/api/axios";

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  organization_id: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("finos_auth_token") : null;
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Fetch authentic user profile from FastAPI backend
      const response = await apiClient.get<UserProfile>("/auth/me");
      setUser(response.data);
    } catch {
      // If token expired or invalid, purge and reset
      if (typeof window !== "undefined") {
        localStorage.removeItem("finos_auth_token");
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const signOut = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Ignore logout connection errors
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("finos_auth_token");
        window.location.href = "/login";
      }
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signOut,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
