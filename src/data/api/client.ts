// services/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Fuentes de env con tipado seguro para Vite
// Vite expone import.meta.env con tipado
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validar que las variables de entorno estén definidas
// Nota: Esta validación se hace aquí, pero el EnvChecker también verifica antes de renderizar
// para mostrar un mensaje de error amigable. Si las variables faltan, se lanzará un error
// cuando se intente usar el cliente, pero el EnvChecker debería prevenir que esto ocurra.
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not configured. The application will show an error message.');
}

// Crear el cliente de Supabase solo si las variables están disponibles
// Si no están disponibles, se creará un cliente dummy que fallará en las operaciones
export const supabase: SupabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : (() => {
      // Crear un cliente dummy que fallará con un mensaje claro
      const dummyUrl = 'https://placeholder.supabase.co';
      const dummyKey = 'dummy-key';
      const client = createClient(dummyUrl, dummyKey);
      
      // Interceptar llamadas para mostrar un error más claro
      return new Proxy(client, {
        get(target, prop) {
          if (prop === 'auth' || prop === 'from' || prop === 'rpc' || prop === 'storage') {
            throw new Error(
              'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
            );
          }
          return target[prop as keyof SupabaseClient];
        },
      }) as SupabaseClient;
    })();

// También puedes exportar el tipo si lo necesitas
export type { SupabaseClient };