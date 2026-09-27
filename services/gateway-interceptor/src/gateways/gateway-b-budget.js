/**
 * Gateway B: Budget & Token Cost Guardrail
 * Enforces spending caps before calling expensive LLM models.
 */

export async function runGatewayB(jevClient, requestContext) {
  const payload = {
    state: {
      agent_id: requestContext.agentId || 'unknown',
      requested_operation: requestContext.operation || 'task execution',
      estimated_cost_cents: requestContext.estimatedCostCents || 0,
      remaining_monthly_budgetCents: requestContext.remainingMonthlyBudgetCents ?? 1000
    },
    questions: {
      within_budget: {
        type: 'noul',
        instruction: 'Is the requested token operation within the authorized task budget threshold?'
      },
      action_gate: {
        type: 'choice',
        instruction: 'What budget action should be taken?',
        criteria: {
          allow: 'Expenditure is justified and well within limits.',
          throttle: 'Reduce batch size or use smaller context to preserve budget.',
          escalate_to_cfo: 'Requires CFO financial approval before execution.'
        }
      }
    }
  };

  const evalResult = await jevClient.evaluate(payload);
  const withinBudget = evalResult.answers.within_budget || { probability: 0.5 };
  const actionGate = evalResult.answers.action_gate || { selected: 'allow', confidence: 0.8 };

  const isApproved = withinBudget.probability >= 0.50 && actionGate.selected === 'allow';

  return {
    gateway: 'B_BUDGET',
    status: isApproved ? 'passed' : 'gated',
    withinBudgetProb: withinBudget.probability,
    action: actionGate.selected,
    confidence: actionGate.confidence,
    requiresCfoEscalation: actionGate.selected === 'escalate_to_cfo',
    latencyMs: evalResult.latencyMs
  };
}
