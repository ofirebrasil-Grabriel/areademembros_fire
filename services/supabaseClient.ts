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

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'https://lvunwfscdkpuwjuaqgmt.supabase.co');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dW53ZnNjZGtwdXdqdWFxZ210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMDg3MTEsImV4cCI6MjA3OTY4NDcxMX0.3jekZ3Y6RlJHc3SFsnEy_gXabV_rKrTyb_Qdjm7qONY');

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**

 * we will mostly rely on mock data in the service layers if the connection fails,
 * but the client is configured correctly for a real Self-Hosted Supabase instance.
 */