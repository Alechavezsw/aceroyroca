-- Migración v4: vínculos de eventos con notas y tareas
-- Ejecutar en Supabase SQL Editor si la agenda no guarda eventos

ALTER TABLE events ADD COLUMN IF NOT EXISTS note_id UUID REFERENCES notes(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;
