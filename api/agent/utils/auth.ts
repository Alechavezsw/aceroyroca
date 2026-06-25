import { createClient } from '@supabase/supabase-js';

export function authenticate(req: any): boolean {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();
  
  const expectedKey = process.env.AGENT_API_KEY;
  
  // Si no hay key configurada o no coincide, fallamos
  if (!expectedKey || token !== expectedKey) {
    return false;
  }
  
  return true;
}

export function getSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  // Lo ideal es usar SERVICE_ROLE_KEY, pero si no está usamos la ANON_KEY por fallback
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URLs or Keys are missing from environment');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}
