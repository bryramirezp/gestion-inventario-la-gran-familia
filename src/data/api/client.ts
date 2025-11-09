// services/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Fuentes de env con tipado seguro para Vite
// Vite expone import.meta.env con tipado, pero TypeScript necesita una aserción de tipo
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

const supabaseUrl = (import.meta as ImportMeta).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as ImportMeta).env?.VITE_SUPABASE_ANON_KEY;

// Validar que las variables de entorno estén definidas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
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