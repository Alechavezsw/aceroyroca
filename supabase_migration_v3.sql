-- Migración v3: datos iniciales Ale Chavez + watchlist
-- Ejecutar en Supabase SQL Editor (o vía MCP aceroyroco)

UPDATE user_config
SET author_name = 'Ale Chavez',
    gemini_model = 'gemini-2.0-flash',
    updated_at = now()
WHERE id = 1;

INSERT INTO user_editorial_store (key, data, updated_at)
VALUES ('watchlist', '["los-azules","josemaria","veladero"]'::jsonb, now())
ON CONFLICT (key) DO UPDATE
SET data = EXCLUDED.data, updated_at = now();
