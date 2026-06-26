import crypto from 'crypto';

const DEFAULT_SECRET = 'aceroyroca-dev-secret';

function getSecret(): string {
  return process.env.AUTH_SECRET || DEFAULT_SECRET;
}

export function signToken(username: string, days = 30): string {
  const exp = Date.now() + days * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ user: username, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyToken(token: string): { user: string } | null {
  const dot = token.indexOf('.');
  if (dot === -1) return null;

  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
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

export function getCredentials(): { username: string; password: string } | null {
  const username = process.env.AUTH_USERNAME;
  const password = process.env.AUTH_PASSWORD;
  if (!username || !password) return null;
  return { username, password };
}
