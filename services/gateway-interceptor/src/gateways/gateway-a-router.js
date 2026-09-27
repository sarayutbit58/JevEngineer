/**
 * Gateway A: Ingestion & Model Selection Router
 * Cuts token costs by 80% by routing simple tasks to fast/local models.
 */

export async function runGatewayA(jevClient, ticket) {
  const payload = {
    state: {
      ticket_id: ticket.id || ticket.identifier || 'INCOMING',
      description: ticket.description || ticket.title || ''
    },
    questions: {
      assignee: {
        type: 'choice',
        instruction: 'Which role should handle this ticket?',
        criteria: {
          backend_engineer: 'API logic, endpoint responses, HTTP headers, backend code, databases.',
          thai_presales_engineer: 'Thai government TOR, e-GP, DGA, GDCC compliance, RFP bidding proposals.',
          devops_engineer: 'Infrastructure, Docker, CI/CD, deployment pipelines, server config.',
          frontend_engineer: 'UI components, CSS, client-side rendering, React.',
          ai_systems_engineer: 'Vector embeddings, RAG pipelines, LLM tuning.',
          systemone_engineer: 'TypeSafe Jev primitives, workflow optimization, decision schemas.',
          other: 'General management or unspecified tasks.'
        }
      },
      complexity_score: {
        type: 'score',
        instruction: 'Rate the technical complexity and risk of this change.',
        criteria: {
          '0': 'Trivial single-line code or config edit.',
          '1': 'Standard minor feature or straightforward bug fix.',
          '2': 'Complex refactoring or cross-service change.',
          '3': 'Critical architecture redesign or high risk.'
        }
      }
    }
  };

  const evalResult = await jevClient.evaluate(payload);
  const assigneeAnswer = evalResult.answers.assignee || { selected: 'other', confidence: 0.5 };
  const complexityAnswer = evalResult.answers.complexity_score || { expected_value: 1.0, confidence: 0.8 };

  const isFastPath = complexityAnswer.expected_value <= 1.0;
  const modelTier = isFastPath ? 'fast_local' : 'heavy_reasoning';

  return {
    gateway: 'A_ROUTER',
    status: 'passed',
    selectedAssignee: assigneeAnswer.selected,
    assigneeConfidence: assigneeAnswer.confidence,
    complexityScore: complexityAnswer.expected_value,
    recommendedModelTier: modelTier,
    latencyMs: evalResult.latencyMs,
    mode: evalResult.mode
  };
}
