import { createClient } from '@supabase/supabase-js';

// Access environment variables securely for Vite
const getEnvVar = (key: string, fallback: string): string => {
  try {
    // @ts-ignore - Vite uses import.meta.env
    const val = import.meta.env[key];
    return val || fallback;
  } catch (e) {
    return fallback;
  }
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', '');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', '');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**

 * we will mostly rely on mock data in the service layers if the connection fails,
 * but the client is configured correctly for a real Self-Hosted Supabase instance.
 */