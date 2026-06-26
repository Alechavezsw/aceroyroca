import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const API_ROUTES: Record<string, string> = {
  '/api/gemini': './api/gemini.ts',
  '/api/news': './api/news.ts',
  '/api/commodities': './api/commodities.ts',
  '/api/auth-login': './api/auth-login.ts',
  '/api/auth-verify': './api/auth-verify.ts',
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && req.url.startsWith('/api/')) {
              const url = new URL(req.url, 'http://localhost');
              const apiPath = url.pathname;

              const modulePath = API_ROUTES[apiPath];
              if (!modulePath) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Endpoint no encontrado en desarrollo' }));
                return;
              }

              try {
                const module = await server.ssrLoadModule(modulePath);
                const handler = module.default;

                let body = {};
                if (req.method === 'POST' || req.method === 'PUT') {
                  const buffers: Buffer[] = [];
                  for await (const chunk of req) {
                    buffers.push(chunk as Buffer);
                  }
                  const rawBody = Buffer.concat(buffers).toString();
                  if (rawBody) {
                    try {
                      body = JSON.parse(rawBody);
                    } catch {
                      body = {};
                    }
                  }
                }

                const mockRes = {
                  statusCode: 200,
                  status(code: number) {
                    this.statusCode = code;
                    res.statusCode = code;
                    return this;
                  },
                  json(data: unknown) {
                    res.setHeader('Content-Type', 'application/json');
                    res.writeHead(this.statusCode);
                    res.end(JSON.stringify(data));
                    return this;
                  },
                  end() {
                    res.writeHead(this.statusCode);
                    res.end();
                    return this;
                  },
                  setHeader(name: string, value: string) {
                    res.setHeader(name, value);
                    return this;
                  }
                };

                const mockReq = {
                  method: req.method,
                  body,
                  query: Object.fromEntries(url.searchParams.entries()),
                  headers: req.headers
                };

                await handler(mockReq, mockRes);
              } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Error desconocido';
                console.error('Error en el middleware API local:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error en API local', details: message }));
              }
            } else {
              next();
            }
          });
        }
      }
    ]
  };
});
