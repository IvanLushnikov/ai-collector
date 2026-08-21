#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API_ORIGIN = (process.env.AI_COLLECTOR_API_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const HOST = process.env.DEV_GATEWAY_HOST || '0.0.0.0';
const PORT = Number(process.env.DEV_GATEWAY_PORT || 8080);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.csv': 'text/csv; charset=utf-8'
};

const API_PREFIXES = ['/tenants', '/campaigns', '/healthz', '/health', '/auth', '/support'];

const shouldProxy = (pathname) => API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

const injectApiOrigin = (body) => {
  const snippet = '<script>window.AI_COLLECTOR_API_URL=window.location.origin;</script>';
  if (body.includes('</head>')) {
    return body.replace('</head>', `${snippet}</head>`);
  }
  return `${snippet}${body}`;
};

const serveFile = (filePath, res, { inject = false } = {}) => {
  fs.readFile(filePath, 'utf8', (err, body) => {
    if (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(err.code === 'ENOENT' ? 'Not found' : 'Failed to read file');
      return;
    }

    const ext = path.extname(filePath);
    const payload = inject ? injectApiOrigin(body) : body;
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(payload);
  });
};

const proxyRequest = (req, res) => {
  const target = new URL(req.url || '/', API_ORIGIN);
  const headers = { ...req.headers, host: target.host };

  const upstream = http.request(
    {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port,
      method: req.method,
      path: `${target.pathname}${target.search}`,
      headers
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    }
  );

  upstream.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'API unavailable', hint: 'Start npm run dev on port 3000' }));
  });

  req.pipe(upstream);
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === '/') {
    res.writeHead(302, { Location: '/landing.html' });
    res.end();
    return;
  }

  if (shouldProxy(pathname)) {
    proxyRequest(req, res);
    return;
  }

  const relativePath = pathname.replace(/^\/+/, '');
  const filePath = path.resolve(ROOT, relativePath);
  if (!filePath.startsWith(`${ROOT}${path.sep}`)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  serveFile(filePath, res, { inject: pathname.endsWith('.html') });
});

server.listen(PORT, HOST, () => {
  console.log(`dev-gateway listening on http://${HOST}:${PORT}`);
  console.log(`landing: http://${HOST}:${PORT}/landing.html`);
  console.log(`prototype: http://${HOST}:${PORT}/prototype.html`);
  console.log(`api proxy: ${API_ORIGIN}`);
});
