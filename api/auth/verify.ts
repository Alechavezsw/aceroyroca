import { verifyToken } from './token';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();

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
