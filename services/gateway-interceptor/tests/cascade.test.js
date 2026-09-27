import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CascadeEngine } from '../src/cascade-engine.js';

describe('Multi-Agent Workflow Cascade Engine', () => {
  const engine = new CascadeEngine();

  test('Recipe Matching: matches titles to declarative workflow recipes', () => {
    const torRecipe = engine.matchRecipe('Thai Government e-GP DGA TOR Tender Platform');
    assert.ok(torRecipe, 'Expected TOR recipe match');
    assert.equal(torRecipe.id, 'thai-gov-tender');

    const featureRecipe = engine.matchRecipe('Full-stack WebSocket notification feature sprint');
    assert.ok(featureRecipe, 'Expected Feature Sprint match');
    assert.equal(featureRecipe.id, 'feature-sprint');
  });

  test('Agent Resolution: resolves CTO, Head of Security, and CFO by name from org roster', () => {
    const ctoId = engine.resolveAgentId('CTO');
    const cisoId = engine.resolveAgentId('Head of Security');
    const cfoId = engine.resolveAgentId('CFO');
    const thaiId = engine.resolveAgentId('Thai Presales Engineer');

    assert.equal(ctoId, '609564fa-dcc5-4109-aa38-4b6d93eb2c1c');
    assert.equal(cisoId, 'c0a14a7c-5153-4942-81fd-f07f3f3ffae4');
    assert.equal(cfoId, 'a700d817-ed15-4752-8a6b-5d9b962d52d1');
    assert.equal(thaiId, 'c12f7855-0f2c-4b1a-82c1-e4e517288364');
  });

  test('Verification & Retry Loop: handles failure retry and board escalation on repeated failure', async () => {
    const testIssue = {
      id: 'test-issue-failure-loop',
      title: 'Thai Government TOR tender document review',
      description: 'Review TOR specs'
    };

    const failingDeliverable = {
      torClause: 'ผู้เสนอราคาต้องจัดเก็บข้อมูล 90 วัน บนระบบ GDCC',
      content: 'System uses AWS CloudWatch logs with 30-day retention' // non-compliant
    };

    // Attempt 1: Should request retry
    const res1 = await engine.processIssueTransition(testIssue, failingDeliverable);
    assert.equal(res1.status, 'retry_requested');
    assert.equal(res1.currentRetries, 1);

    // Attempt 2: Should request retry
    const res2 = await engine.processIssueTransition(testIssue, failingDeliverable);
    assert.equal(res2.status, 'retry_requested');
    assert.equal(res2.currentRetries, 2);

    // Attempt 3: Exceeds maxRetries (2) -> Escalate to Board
    const res3 = await engine.processIssueTransition(testIssue, failingDeliverable);
    assert.equal(res3.status, 'escalated_to_board');
  });

  test('Passing Verification: advances workflow to next stage', async () => {
    const passIssue = {
      id: 'test-issue-pass',
      title: 'Thai Government TOR review and analysis',
      description: 'Compliant proposal package'
    };

    const passingDeliverable = {
      torClause: 'ผู้เสนอราคาต้องจัดเก็บข้อมูลตาม พ.ร.บ. ไม่น้อยกว่า 90 วัน บน Cloud GDCC',
      content: 'Solution provides 90-day retention on Government Data Center and Cloud (GDCC) infrastructure with DGA compliance'
    };

    const res = await engine.processIssueTransition(passIssue, passingDeliverable);
    // Should advance or attempt stage spawning
    assert.ok(res.status === 'advanced' || res.status === 'workflow_finished', `Expected advanced status, got ${res.status}`);
    assert.equal(res.completedStage, 'stage_1_tor_review');
    assert.equal(res.nextStage, 'stage_2_solution_design');
  });
});
