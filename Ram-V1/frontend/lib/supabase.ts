import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";

const isConfigured = Boolean(
  env.NEXT_PUBLIC_SUPABASE_URL &&
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  env.NEXT_PUBLIC_SUPABASE_URL.startsWith("http")
);

export const supabase = isConfigured
  ? createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : (null as any);

export default supabase;
