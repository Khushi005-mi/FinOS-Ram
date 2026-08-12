import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

/**
 * Singleton Supabase JS Client for browser-side authentication
 * and file uploads to Supabase Storage.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);