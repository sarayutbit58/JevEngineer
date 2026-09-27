#!/usr/bin/env node
import { InterceptorEngine } from './index.js';

const engine = new InterceptorEngine();
const args = process.argv.slice(2);
const command = args[0];

function parseNamedArgs(argList) {
  const result = {};
  for (let i = 0; i < argList.length; i++) {
    if (argList[i].startsWith('--')) {
      const key = argList[i].slice(2);
      const next = argList[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        result[key] = next;
        i++;
      } else {
        result[key] = true;
      }
    }
  }
  return result;
}

const params = parseNamedArgs(args.slice(1));

async function main() {
  switch (command) {
    case 'triage': {
      const ticket = {
        id: params.id || 'INCOMING',
        title: params.title || '',
        description: params.description || params.desc || ''
      };
      const result = await engine.triageTask(ticket);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case 'security': {
      const cmd = params.command || params.cmd || '';
      const role = params.role || 'engineer';
      const env = params.env || 'production';
      const result = await engine.guardExecution(cmd, role, env, params.issue);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case 'compliance': {
      const clause = params.clause || '';
      const proposal = params.proposal || '';
      const result = await engine.verifyCompliance(clause, proposal);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case 'quality': {
      const issueId = params.issue || 'unknown';
      const tests = params.tests || '';
      const diff = params.diff || '';
      const docs = params.docs !== 'false';
      const result = await engine.verifyQuality(issueId, tests, diff, docs);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    default:
      console.log('Usage: node src/cli.js <triage|security|compliance|quality> [options]');
      process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
