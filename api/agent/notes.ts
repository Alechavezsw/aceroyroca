import { authenticate, getSupabaseClient } from './utils/auth.js';

export default async function handler(req: any, res: any) {
  // Manejo de CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Autenticar la petición de OpenClaw
  if (!authenticate(req)) {
    return res.status(401).json({ error: 'Unauthorized. Invalid or missing AGENT_API_KEY.' });
  }

  try {
    const supabase = getSupabaseClient();

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { title, content, status } = req.body;
      const { data, error } = await supabase
        .from('notes')
        .insert([{ title, content, status: status || 'draft' }])
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, title, content, status } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing note id' });

      const updates: any = {};
      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;
      if (status !== undefined) updates.status = status;
      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
