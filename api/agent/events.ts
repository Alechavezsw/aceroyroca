import { authenticate, getSupabaseClient } from './utils/auth';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!authenticate(req)) {
    return res.status(401).json({ error: 'Unauthorized. Invalid or missing AGENT_API_KEY.' });
  }

  try {
    const supabase = getSupabaseClient();

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { title, description, start_date, end_date, type } = req.body;
      if (!title || !start_date || !end_date) {
        return res.status(400).json({ error: 'Missing required fields: title, start_date, end_date' });
      }

      const { data, error } = await supabase
        .from('events')
        .insert([{ 
          title, 
          description: description || '', 
          start_date,
          end_date,
          type: type || 'event'
        }])
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, title, description, start_date, end_date, type } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing event id' });

      const updates: any = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (start_date !== undefined) updates.start_date = start_date;
      if (end_date !== undefined) updates.end_date = end_date;
      if (type !== undefined) updates.type = type;

      const { data, error } = await supabase
        .from('events')
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
