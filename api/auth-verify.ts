import { createHmac } from 'node:crypto';

const DEFAULT_SECRET = 'aceroyroca-dev-secret';

function getSecret(): string {
  return (process.env.AUTH_SECRET || DEFAULT_SECRET).trim();
}

function verifyToken(token: string): { user: string } | null {
  const dot = token.indexOf('.');
  if (dot === -1) return null;

  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac('sha256', getSecret()).update(payload).digest('base64url');
  if (sig !== expected) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      user: string;
      exp: number;
    };
    if (!data.user || data.exp < Date.now()) return null;
    return { user: data.user };
  } catch {
    return null;
  }
}

export default async function handler(req: { method?: string; headers?: Record<string, string | string[] | undefined> }, res: {
  status: (code: number) => { json: (data: unknown) => void; end: () => void };
}) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const authHeader = String(req.headers?.authorization || '');
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    res.status(401).json({ valid: false, error: 'Token no proporcionado' });
    return;
  }

  const session = verifyToken(token);
  if (!session) {
    res.status(401).json({ valid: false, error: 'Sesión inválida o expirada' });
    return;
  }

  res.status(200).json({ valid: true, username: session.user });
}
