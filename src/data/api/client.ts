// services/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Fuentes de env con tipado seguro para Vite
// Vite expone import.meta.env con tipado
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validar que las variables de entorno estén definidas
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = `Missing Supabase environment variables. 
    VITE_SUPABASE_URL: ${supabaseUrl ? '✓' : '✗'}
    VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✓' : '✗'}
    Please configure these variables in your Vercel project settings.
    Go to: Project Settings > Environment Variables`;
  console.error(errorMessage);
  throw new Error(errorMessage);
}

// Crear y exportar el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// También puedes exportar el tipo si lo necesitas
export type { SupabaseClient } from '@supabase/supabase-js';