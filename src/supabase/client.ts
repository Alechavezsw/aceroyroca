import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase no está configurado. La aplicación funcionará en modo local utilizando localStorage.' +
    '\nPara activar Supabase, define las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env'
  );
}
