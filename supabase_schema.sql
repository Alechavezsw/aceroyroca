-- ══════════════════════════════════════════════════════
--  ACERO & ROCA — Schema completo para Supabase
--  Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────
--  1. TABLAS
-- ─────────────────────────────────────────────────────

-- Notas (Columnas / Artículos)
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published')),
  words_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tareas (Kanban)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'ideas' CHECK (status IN ('ideas', 'research', 'drafting', 'review', 'published')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Eventos (Calendario)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  type TEXT DEFAULT 'event' CHECK (type IN ('delivery', 'interview', 'meeting', 'event')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Glosario Minero
CREATE TABLE IF NOT EXISTS glossary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  source TEXT DEFAULT '',
  category TEXT DEFAULT 'General',
  example TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Store JSON para cursos custom y progreso
CREATE TABLE IF NOT EXISTS user_editorial_store (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Progreso del Curso
CREATE TABLE IF NOT EXISTS course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id TEXT NOT NULL UNIQUE,
  completed_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Configuración del usuario
CREATE TABLE IF NOT EXISTS user_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- Singleton: solo una fila
  author_name TEXT DEFAULT 'Carlos Fernández',
  gemini_model TEXT DEFAULT 'gemini-3.5-flash',
  word_goal_min INTEGER DEFAULT 800,
  word_goal_max INTEGER DEFAULT 1200,
  rss_feeds TEXT[] DEFAULT ARRAY[
    'https://news.google.com/rss/search?q=minería+argentina&hl=es-419&gl=AR&ceid=AR:es-419',
    'https://www.mining.com/feed/'
  ],
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Insertar configuración por defecto si no existe
INSERT INTO user_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────
--  2. ÍNDICES para performance
-- ─────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_notes_status ON notes(status);
CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_note_id ON tasks(note_id);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_glossary_term ON glossary(term);

-- ─────────────────────────────────────────────────────
--  3. FUNCIONES auxiliares
-- ─────────────────────────────────────────────────────

-- Auto-actualizar updated_at en notas al modificar
CREATE OR REPLACE FUNCTION update_notes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.words_count = array_length(
    regexp_split_to_array(trim(COALESCE(NEW.content, '')), '\s+'), 1
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notas
DROP TRIGGER IF EXISTS trg_notes_updated ON notes;
CREATE TRIGGER trg_notes_updated
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_notes_timestamp();

-- Auto-actualizar updated_at en config
CREATE OR REPLACE FUNCTION update_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_config_updated ON user_config;
CREATE TRIGGER trg_config_updated
  BEFORE UPDATE ON user_config
  FOR EACH ROW
  EXECUTE FUNCTION update_config_timestamp();

-- ─────────────────────────────────────────────────────
--  4. ROW LEVEL SECURITY (RLS)
--  Usando service_role key desde Vercel → sin auth
--  Política: acceso total con anon key (proyecto personal)
-- ─────────────────────────────────────────────────────

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE glossary ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_editorial_store ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para anon (proyecto de uso personal)
CREATE POLICY "Acceso total notas" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total tareas" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total eventos" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total glosario" ON glossary FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total progreso" ON course_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total config" ON user_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total editorial store" ON user_editorial_store FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────
--  5. VISTAS útiles
-- ─────────────────────────────────────────────────────

-- Vista resumen para el Dashboard
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT count(*) FROM notes) AS total_notes,
  (SELECT count(*) FROM notes WHERE status = 'draft') AS drafts,
  (SELECT count(*) FROM notes WHERE status = 'published') AS published,
  (SELECT count(*) FROM tasks WHERE status != 'published') AS pending_tasks,
  (SELECT count(*) FROM tasks WHERE priority = 'high' AND status != 'published') AS urgent_tasks,
  (SELECT count(*) FROM events WHERE start_date >= now()) AS upcoming_events,
  (SELECT count(*) FROM glossary) AS glossary_terms,
  (SELECT count(*) FROM course_progress) AS modules_completed;
