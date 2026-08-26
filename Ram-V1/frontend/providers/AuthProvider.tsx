"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Get initial session from Supabase on app boot
    const initializeAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);

        // Store JWT token for Axios requests to FastAPI
        if (data.session?.access_token) {
          localStorage.setItem("finos_auth_token", data.session.access_token);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // 2. Listen for auth state changes (LOGIN, LOGOUT, TOKEN_REFRESHED)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.access_token) {
          localStorage.setItem("finos_auth_token", currentSession.access_token);
        } else {
          localStorage.removeItem("finos_auth_token");
        }

        setIsLoading(false);
      }
    );

    // Cleanup event listener when component unmounts
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    localStorage.removeItem("finos_auth_token");
    setUser(null);
    setSession(null);
    setIsLoading(false);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom Hook to consume Auth Context in any component
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};