#!/usr/bin/env node
// Tiny local CORS proxy for LLM endpoints that refuse browser requests.
// Zero dependencies, Node 18+.
//
//   node proxy.mjs https://your-endpoint.example/v1
//   # then set Base URL in BYOK Chat to http://localhost:8787
//
// It only listens on 127.0.0.1, forwards every request (including your
// Authorization / x-api-key header) to the target, and streams the reply back
// with CORS headers added. It logs nothing about request bodies or keys.

import http from 'node:http';

const TARGET = (process.argv[2] || process.env.TARGET || '').replace(/\/+$/, '');
const PORT = Number(process.env.PORT || 8787);

if (!/^https?:\/\//.test(TARGET)) {
  console.error('usage: node proxy.mjs <target base url>   e.g. node proxy.mjs https://your-endpoint.example/v1');
  process.exit(1);
}

const DROP_REQ = new Set(['host', 'origin', 'referer', 'connection', 'content-length', 'accept-encoding']);
const DROP_RES = new Set(['content-encoding', 'content-length', 'transfer-encoding', 'connection']);

function cors(req) {
  return {
    'access-control-allow-origin': req.headers.origin || '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': req.headers['access-control-request-headers'] ||
      'authorization, content-type, x-api-key, anthropic-version, anthropic-dangerous-direct-browser-access',
    'access-control-max-age': '600',
    'vary': 'origin',
  };
}

http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, cors(req)); return res.end(); }

  const chunks = [];
  for await (const c of req) chunks.push(c);

  const headers = {};
  for (const [k, v] of Object.entries(req.headers)) if (!DROP_REQ.has(k)) headers[k] = v;

  const ctrl = new AbortController();
  res.on('close', () => ctrl.abort());

  try {
    const up = await fetch(TARGET + req.url, {
      method: req.method,
      headers,
      body: chunks.length ? Buffer.concat(chunks) : undefined,
      signal: ctrl.signal,
    });
    const out = cors(req);
    up.headers.forEach((v, k) => { if (!DROP_RES.has(k) && !k.startsWith('access-control-')) out[k] = v; });
    res.writeHead(up.status, out);
    if (up.body) for await (const c of up.body) res.write(c);
    res.end();
  } catch (e) {
    if (ctrl.signal.aborted) return;
    res.writeHead(502, { ...cors(req), 'content-type': 'text/plain' });
    res.end('proxy error: ' + e.message);
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`BYOK Chat proxy: http://localhost:${PORT}  →  ${TARGET}`);
});
