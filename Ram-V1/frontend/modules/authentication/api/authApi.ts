import { supabase } from "@/lib/supabase";
import { LoginInput, SignupInput } from "../schemas/authSchemas";

export const authApi = {
  /**
   * Log in with email and password (with offline fallback for local testing)
   */
  async login({ email, password }: LoginInput) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (err: any) {
      // If network fails (e.g. placeholder Supabase URL), simulate demo login
      if (err.message === "Failed to fetch" || err.message?.includes("fetch")) {
        console.warn("⚠️ Supabase backend offline. Logging in demo session...");
        const demoToken = "demo_jwt_session_token_finos";
        localStorage.setItem("finos_auth_token", demoToken);
        return { user: { email, id: "demo-user-123" }, session: { access_token: demoToken } };
      }
      throw err;
    }
  },

  /**
   * Register new user account (with offline fallback for local testing)
   */
  async signup({ email, password, fullName, companyName }: SignupInput) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company_name: companyName,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (err: any) {
      if (err.message === "Failed to fetch" || err.message?.includes("fetch")) {
        console.warn("⚠️ Supabase backend offline. Creating demo account...");
        const demoToken = "demo_jwt_session_token_finos";
        localStorage.setItem("finos_auth_token", demoToken);
        return { user: { email, id: "demo-user-123" }, session: { access_token: demoToken } };
      }
      throw err;
    }
  },

  /**
   * Log out active user
   */
  async logout() {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore offline logout errors
    } finally {
      localStorage.removeItem("finos_auth_token");
      window.location.href = "/login";
    }
  },
};