import { getCredentials, signToken } from './token';

export default async function handler(req: any, res: any) {
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
      error: 'Login no configurado. Definí AUTH_USERNAME y AUTH_PASSWORD en el servidor.'
    });
    return;
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    return;
  }

  if (username !== creds.username || password !== creds.password) {
    res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    return;
  }

  const token = signToken(creds.username);
  res.status(200).json({ token, username: creds.username });
}
