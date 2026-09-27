/**
 * Gateway C: Security & Tool Safety Gate
 * Prevents accidental production data loss or harmful SQL/shell execution.
 */

export async function runGatewayC(jevClient, executionContext) {
  const payload = {
    state: {
      agent_role: executionContext.agentRole || 'engineer',
      environment: executionContext.environment || 'production',
      proposed_command: executionContext.command || ''
    },
    questions: {
      is_destructive: {
        type: 'noul',
        instruction: 'Is this proposed command destructive or irreversible to data in production?'
      },
      action_gate: {
        type: 'choice',
        instruction: 'What safety action should the Paperclip harness take?',
        criteria: {
          allow: 'Safe read-only commands, tests, or minor scripts.',
          block: 'Violates explicit safety policy.',
          escalate_to_board: 'Destructive or high-risk actions requiring human approval.'
        }
      }
    }
  };

  const evalResult = await jevClient.evaluate(payload);
  const isDestructive = evalResult.answers.is_destructive || { probability: 0.1 };
  const actionGate = evalResult.answers.action_gate || { selected: 'allow', confidence: 0.9 };

  const isSafe = isDestructive.probability < 0.50 && actionGate.selected === 'allow';
  const requiresBoardApproval = isDestructive.probability >= 0.50 || actionGate.selected === 'escalate_to_board';

  return {
    gateway: 'C_SECURITY',
    status: isSafe ? 'passed' : 'gated',
    isDestructiveProb: isDestructive.probability,
    action: actionGate.selected,
    confidence: actionGate.confidence,
    requiresBoardApproval,
    latencyMs: evalResult.latencyMs
  };
}
