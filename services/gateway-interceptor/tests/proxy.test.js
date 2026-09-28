import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { ProxyServer } from '../src/proxy-server.js';
import { InterceptorEngine } from '../src/index.js';

describe('Synchronous Transparent HTTP Reverse Proxy Interceptor', () => {
  let mockPaperclipServer;
  let mockPaperclipPort;
  let proxy;
  let proxyPort;
  let targetReceivedRequests = [];

  before(async () => {
    // 1. Spin up a lightweight Mock Paperclip Backend Server on an ephemeral port
    mockPaperclipServer = http.createServer((req, res) => {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        const parsedBody = body ? (function() { try { return JSON.parse(body); } catch { return null; } })() : null;
        targetReceivedRequests.push({
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: parsedBody
        });

        if (req.url === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', paperclip: 'mock_server' }));
          return;
        }

        if (req.url.includes('/interactions') && req.method === 'POST') {
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ id: 'int_777', kind: 'request_confirmation', status: 'pending' }));
          return;
        }

        if (req.url.endsWith('/issues') && req.method === 'POST') {
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            id: 'iss_999',
            identifier: 'MCK-999',
            title: parsedBody?.title,
            recommendedModelTier: parsedBody?.recommendedModelTier,
            complexityScore: parsedBody?.complexityScore
          }));
          return;
        }

        if (req.url.endsWith('/execute') && req.method === 'POST') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, executed: parsedBody?.command }));
          return;
        }

        if (req.url === '/api/companies') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ id: 'comp_123', name: 'Mock Company' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, url: req.url }));
      });
    });

    await new Promise((resolve) => {
      mockPaperclipServer.listen(0, '127.0.0.1', () => {
        mockPaperclipPort = mockPaperclipServer.address().port;
        resolve();
      });
    });

    // 2. Start ProxyServer pointing to the Mock Paperclip Server
    // Force apiKey: null for deterministic, fast local evaluation
    const engine = new InterceptorEngine({ apiKey: null });
    proxy = new ProxyServer({
      port: 0, // ephemeral port
      targetBase: `http://127.0.0.1:${mockPaperclipPort}`,
      interceptor: engine
    });

    await proxy.start();
    proxyPort = proxy.server.address().port;
  });

  after(async () => {
    await proxy.stop();
    await new Promise((resolve) => mockPaperclipServer.close(resolve));
  });

  test('GET /health: returns proxy health and reports reachable target Paperclip server', async () => {
    const res = await fetch(`http://127.0.0.1:${proxyPort}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
    assert.equal(data.targetHealth.reachable, true);
    assert.equal(data.zeroCacheMode, true);
  });

  test('Transparent Pass-through: forwards GET /api/companies without modification', async () => {
    const res = await fetch(`http://127.0.0.1:${proxyPort}/api/companies`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.id, 'comp_123');

    const lastReq = targetReceivedRequests[targetReceivedRequests.length - 1];
    assert.equal(lastReq.method, 'GET');
    assert.equal(lastReq.url, '/api/companies');
  });

  test('Gateway A & B Interception: inspects issue creation, enriches model tier, and forwards', async () => {
    const issuePayload = {
      title: 'Update API rate limit response header from X-RateLimit to RateLimit-Limit according to RFC 8966',
      description: 'Minor header response tuning'
    };

    const res = await fetch(`http://127.0.0.1:${proxyPort}/api/companies/comp_123/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issuePayload)
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.id, 'iss_999');
    assert.equal(data.recommendedModelTier, 'fast_local');
    assert.ok(data.complexityScore <= 1.0);
  });

  test('Gateway C Tool Safety: blocks destructive command and escalates to Board (HTTP 202)', async () => {
    const dangerousPayload = {
      command: 'DROP TABLE production_user_credentials;',
      agentRole: 'devops_engineer',
      environment: 'production',
      issueId: 'iss_999'
    };

    const res = await fetch(`http://127.0.0.1:${proxyPort}/api/issues/iss_999/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dangerousPayload)
    });

    // Must be intercepted and held in PENDING_BOARD_APPROVAL (HTTP 202)
    assert.equal(res.status, 202);
    const data = await res.json();
    assert.equal(data.status, 'PENDING_BOARD_APPROVAL');
    assert.equal(data.blocked, true);
    assert.equal(data.gateway, 'C_SECURITY');
    assert.ok(data.riskProbability >= 0.90);
    assert.equal(data.interactionId, 'int_777');
    assert.ok(data.auditId, 'Expected audit ID in response');

    // Crucial: The dangerous command execution must NEVER reach the target backend!
    const leakedExecutes = targetReceivedRequests.filter(r => r.url.endsWith('/execute') && r.body?.command?.includes('DROP TABLE'));
    assert.equal(leakedExecutes.length, 0, 'Destructive command leaked to backend!');

    // But the Board Confirmation interaction WAS created in Paperclip UI:
    const interactions = targetReceivedRequests.filter(r => r.url.includes('/interactions'));
    assert.equal(interactions.length, 1, 'Expected 1 interaction to be posted to Paperclip UI');
  });

  test('Gateway C Tool Safety: fast-paths and forwards safe read-only command (HTTP 200)', async () => {
    const safePayload = {
      command: 'npm run test:coverage',
      agentRole: 'qa_lead',
      environment: 'staging'
    };

    const res = await fetch(`http://127.0.0.1:${proxyPort}/api/issues/iss_999/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(safePayload)
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.executed, 'npm run test:coverage');
  });

  test('GET /proxy/audit: returns in-memory audit ring buffer logs', async () => {
    const res = await fetch(`http://127.0.0.1:${proxyPort}/proxy/audit?limit=10`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.count >= 3);
    assert.ok(Array.isArray(data.audits));

    const blockedEntry = data.audits.find(a => a.action === 'ESCALATE_TO_BOARD');
    assert.ok(blockedEntry, 'Expected to find blocked entry in audit log');
    assert.equal(blockedEntry.gateway, 'C_SECURITY');
    assert.equal(blockedEntry.status, 202);
  });
});
