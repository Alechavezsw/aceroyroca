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
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { title, description, status, priority, due_date, note_id } = req.body;
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ 
          title, 
          description: description || '', 
          status: status || 'ideas',
          priority: priority || 'medium',
          due_date: due_date || null,
          note_id: note_id || null
        }])
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, title, description, status, priority, due_date, note_id } = req.body;
      if (!id) return res.status(400).json({ error: 'Missing task id' });

      const updates: any = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (status !== undefined) updates.status = status;
      if (priority !== undefined) updates.priority = priority;
      if (due_date !== undefined) updates.due_date = due_date;
      if (note_id !== undefined) updates.note_id = note_id;

      const { data, error } = await supabase
        .from('tasks')
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
