import { createBrowserClient } from '@supabase/ssr';

// Supabase client for browser
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton instance for client-side
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient();
  }
  return supabaseInstance;
}

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
