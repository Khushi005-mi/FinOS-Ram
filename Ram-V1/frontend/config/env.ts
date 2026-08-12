import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().default("http://127.0.0.1:8000/api/v1"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().default("https://placeholder.supabase.co"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().default("placeholder-anon-key"),
});

const parseEnv = () => {
  const result = envSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!result.success) {
    return {
      NEXT_PUBLIC_API_URL: "http://127.0.0.1:8000/api/v1",
      NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-anon-key",
    };
  }

  return result.data;
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;