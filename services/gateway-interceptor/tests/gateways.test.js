import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { InterceptorEngine } from '../src/index.js';

describe('System 1 Decision Fabric (Jev by TypeSafe) - 5-Pillar Decision Mesh', () => {
  const engine = new InterceptorEngine();

  test('Gateway A: Ingestion Router routes API header ticket to backend_engineer with fast_local tier', async () => {
    const ticket = {
      id: 'HJC-102',
      title: 'Update API rate limit response header from X-RateLimit to RateLimit-Limit according to RFC 8966'
    };

    const result = await engine.triageTask(ticket);
    
    assert.equal(result.route.selectedAssignee, 'backend_engineer');
    assert.ok(result.route.assigneeConfidence >= 0.85, `Expected confidence >= 0.85, got ${result.route.assigneeConfidence}`);
    assert.ok(result.route.complexityScore <= 1.0, `Expected complexity <= 1.0, got ${result.route.complexityScore}`);
    assert.equal(result.route.recommendedModelTier, 'fast_local');
    assert.ok(result.totalLatencyMs < 100, `Expected latency < 100ms, got ${result.totalLatencyMs}ms`);
    assert.equal(result.decision.tier, 1);
    assert.equal(result.decision.action, 'EXECUTE_FAST_PATH');
  });

  test('Gateway B: Budget Guardrail approves operations within budget and flags excessive costs', async () => {
    const normalTicket = { id: 'HJC-103', title: 'Compile documentation' };
    const withinBudget = await engine.triageTask(normalTicket, { estimatedCostCents: 50, remainingMonthlyBudgetCents: 500 });
    assert.equal(withinBudget.budget.status, 'passed');

    const highCostTicket = { id: 'HJC-104', title: 'Batch generate 10,000 synthetic test personas' };
    const overBudget = await engine.triageTask(highCostTicket, { estimatedCostCents: 5000, remainingMonthlyBudgetCents: 500 });
    assert.equal(overBudget.budget.status, 'gated');
  });

  test('Gateway C: Security Gate allows safe commands and escalates destructive commands to Board', async () => {
    // 1. Safe command
    const safeResult = await engine.guardExecution('npm test -- --coverage', 'qa_lead', 'staging');
    assert.equal(safeResult.security.status, 'passed');
    assert.equal(safeResult.security.requiresBoardApproval, false);
    assert.equal(safeResult.decision.action, 'EXECUTE_FAST_PATH');

    // 2. Destructive command
    const dangerousResult = await engine.guardExecution('DROP TABLE temp_user_migration_v2;', 'devops_engineer', 'production');
    assert.equal(dangerousResult.security.status, 'gated');
    assert.ok(dangerousResult.security.isDestructiveProb >= 0.90, `Expected isDestructiveProb >= 0.90, got ${dangerousResult.security.isDestructiveProb}`);
    assert.equal(dangerousResult.security.requiresBoardApproval, true);
    assert.equal(dangerousResult.decision.tier, 3);
    assert.equal(dangerousResult.decision.action, 'ESCALATE_TO_BOARD');
  });

  test('Gateway D: Compliance Gate flags non-compliant Thai Gov TOR retention mismatch', async () => {
    const torClause = 'ผู้เสนอราคาต้องจัดเก็บข้อมูลจราจรทางคอมพิวเตอร์ตาม พ.ร.บ. คอมพิวเตอร์ ไม่น้อยกว่า 90 วัน และต้องรองรับการจัดเก็บในระบบ Cloud ของ GDCC';
    const nonCompliantProposal = 'System uses AWS CloudWatch logs configured with a 30-day retention policy.';

    const result = await engine.verifyCompliance(torClause, nonCompliantProposal);
    assert.equal(result.compliance.status, 'non_compliant');
    assert.ok(result.compliance.complianceProbability <= 0.10, `Expected prob <= 0.10, got ${result.compliance.complianceProbability}`);
    assert.equal(result.compliance.passed, false);
  });

  test('Gateway E: Code Quality Gate verifies passing test assertions before issue closure', async () => {
    // 1. Passing PR
    const passResult = await engine.verifyQuality(
      'HJC-201',
      '35 passed, 0 failed, 100% assertions met',
      '+45 lines, -12 lines in auth/token_verifier.ts',
      true
    );
    assert.equal(passResult.quality.status, 'passed');
    assert.ok(passResult.quality.releaseReadyProb >= 0.80);
    assert.equal(passResult.quality.passed, true);

    // 2. Failing PR
    const failResult = await engine.verifyQuality(
      'HJC-202',
      '32 passed, 3 failed in auth/token_verifier.test.ts',
      '+120 lines in auth/token_verifier.ts',
      false
    );
    assert.equal(failResult.quality.status, 'needs_revision');
    assert.equal(failResult.quality.passed, false);
  });
});
