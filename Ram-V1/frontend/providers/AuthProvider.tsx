"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: any | null;
  session: any | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!supabase || !supabase.auth) {
      setIsLoading(false);
      return;
    }

    // 1. Get initial active session
    supabase.auth.getSession().then(({ data: { session: currentSession } }: any) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.access_token) {
        localStorage.setItem("finos_auth_token", currentSession.access_token);
      }
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });

    // 2. Listen for auth state changes with explicit types
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: any, currentSession: any) => {
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

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (supabase?.auth) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem("finos_auth_token");
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
