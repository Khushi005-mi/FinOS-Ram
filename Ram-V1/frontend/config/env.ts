/**
 * Safe Environment Variable Resolver
 */
const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl || envUrl.trim() === "") {
    return "http://127.0.0.1:8000/api/v1";
  }
  if (!envUrl.startsWith("http://") && !envUrl.startsWith("https://")) {
    return `https://${envUrl}`;
  }
  return envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl;
};

export const env = {
  NEXT_PUBLIC_API_URL: getApiBaseUrl(),
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  NODE_ENV: process.env.NODE_ENV || "production",
};

export default env;
