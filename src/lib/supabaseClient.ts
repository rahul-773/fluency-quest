import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export let supabase: ReturnType<typeof createClient<Database>> | null = null;
export let supabaseConfigError: string | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
  supabaseConfigError = 'Cloud accounts are not configured. Add the Supabase URL and publishable key to the deployment environment.';
} else {
  try {
    const url = new URL(supabaseUrl);
    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (url.protocol !== 'https:' && !(isLocal && url.protocol === 'http:')) {
      throw new Error('The Supabase URL must use HTTPS.');
    }
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    supabaseConfigError = error instanceof Error ? error.message : 'The Supabase configuration is invalid.';
  }
}
