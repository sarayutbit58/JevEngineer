import http from 'http';
import { InterceptorEngine } from './index.js';

const PORT = process.env.GATEWAY_PORT || 3105;
const engine = new InterceptorEngine();

function jsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
  }

  try {
    if (pathname === '/health' && req.method === 'GET') {
      return jsonResponse(res, 200, {
        status: 'ok',
        service: 'TypeSafe Jev Gateway Interceptor',
        mode: engine.client.mode,
        timestamp: new Date().toISOString()
      });
    }

    if (pathname === '/gateways/triage' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await engine.triageTask(body.ticket || body, body.budget);
      return jsonResponse(res, 200, result);
    }

    if (pathname === '/gateways/c-security' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await engine.guardExecution(body.command, body.agentRole, body.env, body.issueId);
      return jsonResponse(res, 200, result);
    }

    if (pathname === '/gateways/d-compliance' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await engine.verifyCompliance(body.torClause, body.solutionProposal);
      return jsonResponse(res, 200, result);
    }

    if (pathname === '/gateways/e-quality' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await engine.verifyQuality(body.issueId, body.testResults, body.gitDiffSummary, body.documentationUpdated);
      return jsonResponse(res, 200, result);
    }

    return jsonResponse(res, 404, { error: `Endpoint ${pathname} not found.` });
  } catch (err) {
    console.error(`[GatewayServer] Error processing request ${pathname}:`, err);
    return jsonResponse(res, 500, { error: err.message });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[TypeSafe Jev Gateway Interceptor] Listening on http://127.0.0.1:${PORT}`);
  console.log(`[TypeSafe Jev Gateway Interceptor] Mode: ${engine.client.mode}`);
});
