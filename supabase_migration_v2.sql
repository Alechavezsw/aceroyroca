-- Migración v2: sync editorial (glosario extendido + store JSON)
-- Ejecutar en Supabase SQL Editor después de supabase_schema.sql

ALTER TABLE glossary ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';
ALTER TABLE glossary ADD COLUMN IF NOT EXISTS example TEXT;

CREATE TABLE IF NOT EXISTS user_editorial_store (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE user_editorial_store ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso total editorial store" ON user_editorial_store;
CREATE POLICY "Acceso total editorial store" ON user_editorial_store
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_editorial_store_updated ON user_editorial_store(updated_at DESC);

-- Nombre de autor por defecto
UPDATE user_config SET author_name = 'Ale Chavez' WHERE id = 1 AND author_name = 'Carlos Fernández';
