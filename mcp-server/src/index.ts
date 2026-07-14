import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Carga mcp-server/.env (las variables ya presentes en el entorno tienen prioridad)
try {
  const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.env');
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (match && !line.trim().startsWith('#') && !(match[1] in process.env)) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
} catch {
  /* sin .env: se usan las variables del entorno */
}

const API_URL = (process.env.ACERO_API_URL || '').replace(/\/$/, '');
const API_KEY = process.env.AGENT_API_KEY || '';

async function api<T>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' = 'GET',
  body?: Record<string, unknown>
): Promise<T> {
  if (!API_URL) throw new Error('Falta ACERO_API_URL en el entorno del MCP server.');
  if (!API_KEY) throw new Error('Falta AGENT_API_KEY en el entorno del MCP server.');

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    /* respuesta no JSON */
  }

  if (!res.ok) {
    const msg =
      typeof data === 'object' && data && 'error' in data
        ? String((data as { error: string }).error)
        : text || res.statusText;
    throw new Error(`${res.status}: ${msg}`);
  }

  return data as T;
}

function jsonResult(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }]
  };
}

const server = new McpServer({
  name: 'aceroyroca',
  version: '1.0.0'
});

server.tool(
  'list_notes',
  'Lista todas las columnas/notas del portal Acero & Roca.',
  {},
  async () => jsonResult(await api('/api/agent/notes'))
);

server.tool(
  'create_note',
  'Crea una nueva nota o columna en borrador.',
  {
    title: z.string().describe('Título de la columna'),
    content: z.string().optional().describe('Cuerpo en markdown o texto plano'),
    status: z.enum(['draft', 'review', 'published']).optional()
  },
  async ({ title, content, status }) =>
    jsonResult(await api('/api/agent/notes', 'POST', { title, content, status }))
);

server.tool(
  'update_note',
  'Actualiza una nota existente por id.',
  {
    id: z.string().uuid().describe('UUID de la nota'),
    title: z.string().optional(),
    content: z.string().optional(),
    status: z.enum(['draft', 'review', 'published']).optional()
  },
  async (body) => jsonResult(await api('/api/agent/notes', 'PUT', body))
);

server.tool(
  'list_tasks',
  'Lista tareas del kanban editorial.',
  {},
  async () => jsonResult(await api('/api/agent/tasks'))
);

server.tool(
  'create_task',
  'Crea una tarea en el kanban.',
  {
    title: z.string(),
    description: z.string().optional(),
    status: z
      .enum(['ideas', 'research', 'drafting', 'review', 'published'])
      .optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    due_date: z.string().optional().describe('Fecha YYYY-MM-DD'),
    note_id: z.string().uuid().optional().describe('Nota vinculada')
  },
  async (body) => jsonResult(await api('/api/agent/tasks', 'POST', body))
);

server.tool(
  'update_task',
  'Actualiza una tarea del kanban.',
  {
    id: z.string().uuid(),
    title: z.string().optional(),
    description: z.string().optional(),
    status: z
      .enum(['ideas', 'research', 'drafting', 'review', 'published'])
      .optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    due_date: z.string().optional(),
    note_id: z.string().uuid().optional()
  },
  async (body) => jsonResult(await api('/api/agent/tasks', 'PUT', body))
);

server.tool(
  'list_events',
  'Lista eventos del calendario editorial.',
  {},
  async () => jsonResult(await api('/api/agent/events'))
);

server.tool(
  'create_event',
  'Crea un evento en el calendario.',
  {
    title: z.string(),
    description: z.string().optional(),
    start_date: z.string().describe('ISO 8601, ej. 2026-06-25T10:00:00Z'),
    end_date: z.string().describe('ISO 8601'),
    type: z.enum(['delivery', 'interview', 'meeting', 'event']).optional()
  },
  async (body) => jsonResult(await api('/api/agent/events', 'POST', body))
);

server.tool(
  'update_event',
  'Actualiza un evento del calendario.',
  {
    id: z.string().uuid(),
    title: z.string().optional(),
    description: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    type: z.enum(['delivery', 'interview', 'meeting', 'event']).optional()
  },
  async (body) => jsonResult(await api('/api/agent/events', 'PUT', body))
);

const transport = new StdioServerTransport();
await server.connect(transport);
