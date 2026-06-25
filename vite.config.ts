import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
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
            
            // Determinar la ruta del módulo
            let modulePath = '';
            if (apiPath === '/api/gemini') {
              modulePath = './api/gemini.ts';
            } else if (apiPath === '/api/news') {
              modulePath = './api/news.ts';
            } else if (apiPath === '/api/commodities') {
              modulePath = './api/commodities.ts';
            } else {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Endpoint no encontrado en desarrollo' }));
              return;
            }

            try {
              // Cargar módulo de TypeScript usando Vite SSR
              const module = await server.ssrLoadModule(modulePath);
              const handler = module.default;

              // Parsear el cuerpo de la petición si es POST
              let body = {};
              if (req.method === 'POST') {
                const buffers: any[] = [];
                for await (const chunk of req) {
                  buffers.push(chunk);
                }
                const rawBody = Buffer.concat(buffers).toString();
                if (rawBody) {
                  try {
                    body = JSON.parse(rawBody);
                  } catch (e) {
                    body = {};
                  }
                }
              }

              // Simular objeto Response de Vercel
              const mockRes = {
                statusCode: 200,
                status(code: number) {
                  this.statusCode = code;
                  res.statusCode = code;
                  return this;
                },
                json(data: any) {
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

              // Simular objeto Request de Vercel
              const mockReq = {
                method: req.method,
                body: body,
                query: Object.fromEntries(url.searchParams.entries()),
                headers: req.headers
              };

              await handler(mockReq, mockRes);
            } catch (error: any) {
              console.error('Error en el middleware API local:', error);
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Error en API local', details: error.message }));
            }
          } else {
            next();
          }
        });
      }
    }
  ]
})

