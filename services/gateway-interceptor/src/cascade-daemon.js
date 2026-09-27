import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CascadeEngine } from './cascade-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PID_FILE = path.resolve(__dirname, '../cascade-daemon.pid');
const LOG_FILE = path.resolve(__dirname, '../cascade-daemon.log');

export class CascadeDaemon {
  constructor(options = {}) {
    this.apiBase = options.apiBase || 'http://127.0.0.1:3100';
    this.companyId = options.companyId || 'ba9c8f2b-7942-4917-aae5-8320e3a9a7c7';
    this.intervalMs = options.intervalMs || 3000;
    this.engine = new CascadeEngine(options);
    this.running = false;
    this.timer = null;
    this.knownIssueStatuses = new Map(); // issueId -> status
  }

  log(msg) {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] ${msg}\n`;
    process.stdout.write(formatted);
    try {
      fs.appendFileSync(LOG_FILE, formatted, 'utf8');
    } catch {}
  }

  async checkIssues() {
    try {
      const res = await fetch(`${this.apiBase}/api/companies/${this.companyId}/issues`);
      if (!res.ok) return;

      const issues = await res.json();
      for (const issue of issues) {
        const prevStatus = this.knownIssueStatuses.get(issue.id);
        this.knownIssueStatuses.set(issue.id, issue.status);

        // Check if issue recently transitioned to 'done' or 'in_review'
        const isDoneOrReview = issue.status === 'done' || issue.status === 'in_review';
        const isNewCompletion = prevStatus && prevStatus !== issue.status && isDoneOrReview;

        if (isNewCompletion) {
          this.log(`Detected completion on issue ${issue.identifier || issue.id} (${issue.title}) -> Status: ${issue.status}`);

          // Fetch documents or comments for deliverable verification
          let deliverables = { content: issue.description || '' };
          try {
            const docsRes = await fetch(`${this.apiBase}/api/issues/${issue.id}/documents`);
            if (docsRes.ok) {
              const docs = await docsRes.json();
              if (docs.length > 0) {
                deliverables.content = docs.map(d => d.body || '').join('\n\n');
              }
            }
          } catch {}

          const result = await this.engine.processIssueTransition(issue, deliverables);
          this.log(`Cascade Result for ${issue.identifier || issue.id}: ${JSON.stringify(result)}`);
        }
      }
    } catch (err) {
      this.log(`Error checking Paperclip issues: ${err.message}`);
    }
  }

  start() {
    this.running = true;
    fs.writeFileSync(PID_FILE, process.pid.toString(), 'utf8');
    this.log(`Cascade Daemon started with PID ${process.pid} (Company: ${this.companyId}, Interval: ${this.intervalMs}ms)`);

    this.timer = setInterval(() => {
      if (this.running) {
        this.checkIssues();
      }
    }, this.intervalMs);

    // Initial check
    this.checkIssues();
  }

  stop() {
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    if (fs.existsSync(PID_FILE)) {
      try { fs.unlinkSync(PID_FILE); } catch {}
    }
    this.log('Cascade Daemon stopped.');
  }
}

// Standalone execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const daemon = new CascadeDaemon();
  daemon.start();

  process.on('SIGINT', () => {
    daemon.stop();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    daemon.stop();
    process.exit(0);
  });
}
