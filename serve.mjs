// Minimal static file server for local development:  node serve.mjs [port]
// The app is plain static files, so any static server works — this one just
// avoids depending on anything being installed.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';

const root = process.cwd();
const port = Number(process.argv[2]) || 8000;

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

createServer(async (request, response) => {
  const requestPath = decodeURIComponent(request.url.split('?')[0]);
  const relative = normalize(requestPath).replace(/^(\.\.[/\\])+/, '');
  let filePath = join(root, relative);
  if (requestPath.endsWith('/')) filePath = join(filePath, 'index.html');

  if (!filePath.startsWith(root + sep) && filePath !== root) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  }
}).listen(port, () => {
  console.log(`Memory Camp running at http://localhost:${port}`);
});
