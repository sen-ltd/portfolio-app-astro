import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.resolve(__dirname, '../../data/entries.json');

export default defineConfig({
  output: 'static',
  base: '/portfolio/portfolio-app-astro',
  site: 'https://sen.ltd',
  vite: {
    plugins: [
      {
        name: 'dev-data-json',
        configureServer(server) {
          // Serve entries.json as /data.json and /portfolio/data.json in dev
          server.middlewares.use((req, res, next) => {
            if (req.url === '/data.json' || req.url === '/portfolio/data.json') {
              try {
                const data = fs.readFileSync(dataPath, 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.end(data);
              } catch {
                res.statusCode = 500;
                res.end('{"error":"entries.json not found"}');
              }
              return;
            }
            next();
          });
        },
      },
    ],
  },
});
