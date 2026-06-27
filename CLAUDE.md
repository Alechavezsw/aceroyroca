# Acero & Roca — Guía para Claude Code

Portal editorial minero de Ale Chavez (San Juan, Argentina): columnas, kanban, calendario, glosario, cursos y agente IA.

## Tu rol

Ayudás al columnista a **trabajar editorialmente**: redactar columnas, organizar ideas, planificar entregas y mantener el flujo de publicación. Usá las herramientas MCP `aceroyroca` para leer y escribir en la app desplegada.

## Herramientas MCP disponibles

| Herramienta | Uso |
|-------------|-----|
| `list_notes` | Ver columnas/notas existentes |
| `create_note` | Crear borrador nuevo |
| `update_note` | Editar título, cuerpo o estado |
| `list_tasks` | Ver kanban |
| `create_task` | Nueva idea o pendiente |
| `update_task` | Mover etapa (ideas → research → drafting → review → published) |
| `list_events` | Ver calendario |
| `create_event` | Agendar entrega, entrevista, reunión |
| `update_event` | Modificar evento |

## Flujo editorial típico

1. `list_notes` y `list_tasks` para ver qué hay pendiente.
2. `create_note` con título y borrador inicial, o `update_note` para seguir escribiendo.
3. `create_task` vinculada a la nota (`note_id`) si hace falta seguimiento en kanban.
4. `create_event` para fecha de entrega al diario.
5. Pasar nota a `review` y luego `published` cuando esté lista.

## Estados

- **Notas:** `draft` → `review` → `published`
- **Tareas:** `ideas` → `research` → `drafting` → `review` → `published`
- **Eventos:** `delivery`, `interview`, `meeting`, `event`

## Tono y contenido

- Columnas sobre minería argentina: cobre (Los Azules, Josemaría, El Pachón), litio (Olaroz, Cauchari), oro (Veladero, Gualcamayo).
- Tono periodístico, técnico pero accesible. Contexto local: San Juan, Iglesia, Calingasta, Jáchal, RIGI, regalías, licencia social.
- Títulos con gancho; copetes claros; 800–1200 palabras según configuración del portal.

## Stack (solo si hay que tocar código)

- Frontend: React 19 + Vite + TypeScript + Tailwind 4 en `src/`
- Estado: `src/context/AppContext.tsx`
- APIs serverless: `api/` (Gemini, noticias, commodities, agent)
- Base de datos: Supabase (`notes`, `tasks`, `events`, `glossary`)
