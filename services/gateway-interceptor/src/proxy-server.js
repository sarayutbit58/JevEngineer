import http from 'http';
import { InterceptorEngine } from './index.js';

export class ProxyServer {
  constructor(options = {}) {
    this.targetBase = options.targetBase || process.env.PAPERCLIP_TARGET_URL || 'http://127.0.0.1:3100';
    this.port = options.port || Number(process.env.GATEWAY_PORT || 3105);
    this.engine = options.interceptor || new InterceptorEngine(options);
    this.auditBuffer = [];
    this.maxAuditEntries = options.maxAuditEntries || 100;
    this.server = null;
  }

  recordAudit(entry) {
    const record = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    this.auditBuffer.unshift(record);
    if (this.auditBuffer.length > this.maxAuditEntries) {
      this.auditBuffer.length = this.maxAuditEntries;
    }
    return record;
  }

  getAuditLogs(limit = 50) {
    return this.auditBuffer.slice(0, Math.min(limit, this.auditBuffer.length));
  }

  clearAuditLogs() {
    this.auditBuffer = [];
  }

  async checkTargetHealth() {
    try {
      const res = await fetch(`${this.targetBase}/health`, { signal: AbortSignal.timeout(2000) });
      return { reachable: res.ok, status: res.status };
    } catch (err) {
      return { reachable: false, error: err.message };
    }
  }

  async handleRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // 1. Health check endpoint
    if (pathname === '/health' && req.method === 'GET') {
      const targetHealth = await this.checkTargetHealth();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        service: 'TypeSafe Jev Gateway Interceptor & Reverse Proxy',
        proxyPort: this.port,
        targetBase: this.targetBase,
        targetHealth,
        mode: this.engine.client.mode,
        cachedDecisions: 0,
        zeroCacheMode: true,
        auditCount: this.auditBuffer.length,
        timestamp: new Date().toISOString()
      }, null, 2));
      return;
    }

    // 2. Proxy audit log endpoint
    if (pathname === '/proxy/audit' && req.method === 'GET') {
      const limit = Number(url.searchParams.get('limit') || 50);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        count: this.auditBuffer.length,
        limit,
        audits: this.getAuditLogs(limit)
      }, null, 2));
      return;
    }

    // 3. Standalone Gateway Endpoints (Backward Compatibility)
    if (pathname === '/gateways/triage' && req.method === 'POST') {
      const body = await this._parseJsonBody(req);
      const result = await this.engine.triageTask(body.ticket || body, body.budget);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result, null, 2));
      return;
    }

    if (pathname === '/gateways/c-security' && req.method === 'POST') {
      const body = await this._parseJsonBody(req);
      const result = await this.engine.guardExecution(body.command, body.agentRole, body.env, body.issueId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result, null, 2));
      return;
    }

    if (pathname === '/gateways/d-compliance' && req.method === 'POST') {
      const body = await this._parseJsonBody(req);
      const result = await this.engine.verifyCompliance(body.torClause, body.solutionProposal);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result, null, 2));
      return;
    }

    if (pathname === '/gateways/e-quality' && req.method === 'POST') {
      const body = await this._parseJsonBody(req);
      const result = await this.engine.verifyQuality(body.issueId, body.testResults, body.gitDiffSummary, body.documentationUpdated);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result, null, 2));
      return;
    }

    // 4. Pass-through for non-mutating requests (GET, HEAD)
    if (req.method === 'GET' || req.method === 'HEAD') {
      this._proxyDirect(req, res, pathname, url.search);
      return;
    }

    // 5. Mutating Request Interception (POST, PUT, PATCH, DELETE)
    // Always-Evaluate Zero-Cache Mode: Inspect body freshly with Jev Gateways
    await this._interceptMutatingRequest(req, res, pathname, url.search);
  }

  async _interceptMutatingRequest(req, res, pathname, search) {
    const startTime = performance.now();
    let bodyBuffer;
    let bodyJson = {};

    try {
      bodyBuffer = await this._readBodyBuffer(req);
      if (bodyBuffer.length > 0) {
        try {
          bodyJson = JSON.parse(bodyBuffer.toString('utf8'));
        } catch {
          // Non-JSON mutating body, forward directly
          this._forwardBuffered(req, res, pathname, search, bodyBuffer);
          return;
        }
      }
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Could not read request body: ${err.message}` }));
      return;
    }

    // Inspection Case A: Tool execution / shell execution / destructive command guarding (Gateway C)
    const proposedCmd = bodyJson.command || bodyJson.proposed_command || bodyJson.cmd || (bodyJson.input && bodyJson.input.command);
    if (proposedCmd && typeof proposedCmd === 'string') {
      const role = bodyJson.agentRole || bodyJson.role || 'engineer';
      const env = bodyJson.environment || bodyJson.env || 'production';
      const issueId = bodyJson.issueId || bodyJson.issue_id || null;

      const secResult = await this.engine.guardExecution(proposedCmd, role, env, issueId);
      const latencyMs = Math.round(performance.now() - startTime);

      // Tier 3 Escalation: Block and escalate to Board
      if (secResult.decision.action === 'ESCALATE_TO_BOARD' || secResult.security.requiresBoardApproval) {
        const audit = this.recordAudit({
          method: req.method,
          path: pathname,
          gateway: 'C_SECURITY',
          verdict: 'gated',
          action: 'ESCALATE_TO_BOARD',
          tier: 3,
          confidence: secResult.security.confidence,
          latencyMs,
          status: 202,
          details: { command: proposedCmd, isDestructiveProb: secResult.security.isDestructiveProb, reason: secResult.decision.reason }
        });

        // Trigger interactive request_confirmation in Paperclip if target is live
        let interactionId = null;
        if (issueId) {
          interactionId = await this._createPaperclipConfirmation(issueId, proposedCmd, secResult.decision.reason);
        }

        res.writeHead(202, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'PENDING_BOARD_APPROVAL',
          blocked: true,
          gateway: 'C_SECURITY',
          interactionId,
          auditId: audit.id,
          reason: secResult.decision.reason,
          riskProbability: secResult.security.isDestructiveProb,
          escalation: secResult.decision,
          message: 'Execution halted by System 1 Security Gateway. Confirmation requested from Board in Paperclip UI.'
        }, null, 2));
        return;
      }

      // Safe Fast-Path
      this.recordAudit({
        method: req.method,
        path: pathname,
        gateway: 'C_SECURITY',
        verdict: 'passed',
        action: 'EXECUTE_FAST_PATH',
        tier: 1,
        confidence: secResult.security.confidence,
        latencyMs,
        status: 200,
        details: { command: proposedCmd }
      });

      this._forwardBuffered(req, res, pathname, search, bodyBuffer);
      return;
    }

    // Inspection Case B: Issue Creation (Gateway A & B Triage)
    if (pathname.includes('/issues') && req.method === 'POST' && (bodyJson.title || bodyJson.description)) {
      const ticket = {
        title: bodyJson.title || '',
        description: bodyJson.description || ''
      };

      const triage = await this.engine.triageTask(ticket, bodyJson.budget);
      const latencyMs = Math.round(performance.now() - startTime);

      if (triage.budget.status === 'gated' || triage.budget.requiresCfoEscalation) {
        const audit = this.recordAudit({
          method: req.method,
          path: pathname,
          gateway: 'B_BUDGET',
          verdict: 'gated',
          action: 'ESCALATE_TO_CFO',
          tier: 3,
          confidence: triage.budget.confidence,
          latencyMs,
          status: 202,
          details: { title: ticket.title, withinBudgetProb: triage.budget.withinBudgetProb }
        });

        res.writeHead(202, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'PENDING_CFO_APPROVAL',
          blocked: true,
          gateway: 'B_BUDGET',
          auditId: audit.id,
          reason: 'Token expenditure exceeds authorized monthly budget cap. Requires CFO approval.',
          triage
        }, null, 2));
        return;
      }

      // Auto-enrich issue assignment if not explicitly pinned
      if (!bodyJson.assigneeAgentId && triage.route.selectedAssignee) {
        bodyJson.recommendedModelTier = triage.route.recommendedModelTier;
        bodyJson.complexityScore = triage.route.complexityScore;
      }

      this.recordAudit({
        method: req.method,
        path: pathname,
        gateway: 'A_ROUTER & B_BUDGET',
        verdict: 'passed',
        action: triage.decision.action,
        tier: triage.decision.tier,
        confidence: triage.route.assigneeConfidence,
        latencyMs,
        status: 200,
        details: { title: ticket.title, assignee: triage.route.selectedAssignee, modelTier: triage.route.recommendedModelTier }
      });

      const updatedBuffer = Buffer.from(JSON.stringify(bodyJson), 'utf8');
      this._forwardBuffered(req, res, pathname, search, updatedBuffer);
      return;
    }

    // Default: Forward other mutating calls directly
    this._forwardBuffered(req, res, pathname, search, bodyBuffer);
  }

  async _createPaperclipConfirmation(issueId, command, reason) {
    try {
      const res = await fetch(`${this.targetBase}/api/issues/${issueId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'request_confirmation',
          title: 'Board Approval Required: High-Risk Command Blocked',
          description: `Gateway C flagged command:\n\`${command}\`\n\nReason: ${reason}`
        }),
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        const data = await res.json();
        return data.id || null;
      }
    } catch {
      // Fallback silently if target paperclip has no active interaction endpoint
    }
    return null;
  }

  _proxyDirect(req, res, pathname, search) {
    const targetUrl = new URL(pathname + search, this.targetBase);
    const headers = { ...req.headers, host: targetUrl.host };

    const proxyReq = http.request(targetUrl, {
      method: req.method,
      headers
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Bad Gateway: Could not reach Paperclip target server',
        target: targetUrl.href,
        message: err.message
      }));
    });

    req.pipe(proxyReq);
  }

  _forwardBuffered(req, res, pathname, search, buffer) {
    const targetUrl = new URL(pathname + search, this.targetBase);
    const headers = {
      ...req.headers,
      host: targetUrl.host,
      'content-length': buffer.length
    };

    const proxyReq = http.request(targetUrl, {
      method: req.method,
      headers
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Bad Gateway: Could not reach Paperclip target server',
        target: targetUrl.href,
        message: err.message
      }));
    });

    proxyReq.write(buffer);
    proxyReq.end();
  }

  _readBodyBuffer(req) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
  }

  _parseJsonBody(req) {
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

  start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => this.handleRequest(req, res));
      this.server.listen(this.port, '127.0.0.1', () => {
        console.log(`[Jev Reverse Proxy] Listening on http://127.0.0.1:${this.port}`);
        console.log(`[Jev Reverse Proxy] Forwarding to Paperclip on ${this.targetBase}`);
        console.log(`[Jev Reverse Proxy] Mode: ${this.engine.client.mode} (Zero-Cache Mode Enabled)`);
        resolve(this.server);
      });
      this.server.on('error', reject);
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('[Jev Reverse Proxy] Server stopped.');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
