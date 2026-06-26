# Acero & Roca — Portal Editorial Minero

Portal del columnista: dashboard, redacción, agente IA (Gemini), curso de minería, mapa de proyectos, glosario y kanban.

## Desarrollo local

```bash
npm install
cp .env.example .env.local
# Completar GEMINI_API_KEY (mínimo) y opcionalmente Supabase
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

**Login:** usuario y contraseña en `AUTH_USERNAME` / `AUTH_PASSWORD` (ver `.env.example`). En local van en `.env.local`.

## Deploy en Vercel

### 1. Conectar repositorio

1. [vercel.com/new](https://vercel.com/new) → importar el repo de GitHub.
2. Vercel detecta **Vite** automáticamente (`vercel.json` ya configurado).
3. No cambies Build Command ni Output Directory.

### 2. Variables de entorno (Vercel → Settings → Environment Variables)

| Variable | Entorno | Obligatoria |
|----------|---------|-------------|
| `GEMINI_API_KEY` | Production, Preview | Sí |
| `AUTH_USERNAME` | Production, Preview | Sí |
| `AUTH_PASSWORD` | Production, Preview | Sí |
| `AUTH_SECRET` | Production, Preview | Sí* |
| `VITE_SUPABASE_URL` | Production, Preview | No* |
| `VITE_SUPABASE_ANON_KEY` | Production, Preview | No* |
| `METALS_API_KEY` | Production, Preview | No |
| `AGENT_API_KEY` | Production, Preview | No** |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | No** |

\* Sin Supabase la app usa `localStorage` en el navegador del usuario.  
\* `AUTH_SECRET`: string aleatorio largo para firmar sesiones (no compartir).  
\** Solo si usás los endpoints `/api/agent/*`.

Las variables `VITE_*` deben estar definidas **antes del build** (redeploy tras agregarlas).

### 3. Supabase (opcional)

**Proyecto nuevo:** ejecutar `supabase_schema.sql` en SQL Editor.  
**Proyecto existente:** ejecutar además `supabase_migration_v2.sql`.

### 4. Deploy

```bash
npx vercel          # preview
npx vercel --prod   # producción
```

O push a `main` si tenés Git integrado con Vercel.

### 5. Verificar en producción

- `/` carga el dashboard
- `/api/commodities` devuelve JSON
- `/api/news` devuelve noticias
- Agente IA responde (requiere `GEMINI_API_KEY`)

## Estructura

```
api/           → Serverless functions (Gemini, noticias, commodities)
src/           → Frontend React + Vite
public/        → Assets estáticos y PWA manifest
vercel.json    → Configuración de deploy
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run preview` | Preview del build local |

## Claude Code — trabajar y hacer notas

Para que **Claude Code** gestione columnas, kanban y calendario desde el chat (sin tocar código a mano):

### 1. Variables en Vercel

| Variable | Para qué |
|----------|----------|
| `AGENT_API_KEY` | Clave secreta que inventás (ej. `acr_xxx...`) |
| `VITE_SUPABASE_URL` | URL de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Escritura desde la API del agente |
| `GEMINI_API_KEY` | IA en la app web (aparte) |

Redeploy después de configurarlas.

### 2. MCP server (una vez)

```bash
cd mcp-server
npm install
npm run build
```

### 3. Configurar Claude Code

Copiá `.mcp.json.example` → `.mcp.json` y completá:

- `ACERO_API_URL` → URL de tu app en Vercel
- `AGENT_API_KEY` → la misma clave que en Vercel

Abrí el proyecto con Claude Code (`claude` en la carpeta del repo). Verificá con `/mcp` que aparezca **aceroyroca**.

### 4. Ejemplos de lo que podés pedirle

- *"Listá mis notas y decime qué tengo pendiente"*
- *"Creá un borrador sobre el RIGI y Los Azules"*
- *"Agregá una tarea de investigación para la columna del litio"*
- *"Agendá entrega para el viernes a las 18hs"*

El archivo `CLAUDE.md` le da contexto editorial al agente.

