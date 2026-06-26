import { createHmac } from 'node:crypto';

const DEFAULT_SECRET = 'aceroyroca-dev-secret';

function getSecret(): string {
  return (process.env.AUTH_SECRET || DEFAULT_SECRET).trim();
}

function getCredentials(): { username: string; password: string } | null {
  const username = process.env.AUTH_USERNAME?.trim();
  const password = process.env.AUTH_PASSWORD?.trim();
  if (!username || !password) return null;
  return { username, password };
}

function signToken(username: string, days = 30): string {
  const exp = Date.now() + days * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ user: username, exp })).toString('base64url');
  const sig = createHmac('sha256', getSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function parseBody(req: { body?: unknown }): Record<string, string> {
  const raw = req.body;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, string>;
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      return JSON.parse(raw) as Record<string, string>;
    } catch {
      return {};
    }
  }
  return {};
}

export default async function handler(req: { method?: string; body?: unknown }, res: {
  status: (code: number) => { json: (data: unknown) => void; end: () => void };
}) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const creds = getCredentials();
  if (!creds) {
    res.status(500).json({
      error: 'Login no configurado. Definí AUTH_USERNAME y AUTH_PASSWORD en Vercel.'
    });
    return;
  }

  const body = parseBody(req);
  const username = body.username?.trim();
  const password = body.password ?? '';

  if (!username || !password) {
    res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    return;
  }

  if (username !== creds.username || password !== creds.password) {
    res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    return;
  }

  res.status(200).json({ token: signToken(creds.username), username: creds.username });
}
