/**
 * Gateway D: Spec & Compliance Verification Gate
 * Scans proposals and specifications against Thai Gov TOR clauses (e-GP/DGA/GDCC/PDPA).
 */

export async function runGatewayD(jevClient, complianceContext) {
  const payload = {
    state: {
      tor_clause_text: complianceContext.torClause || '',
      solution_proposal: complianceContext.solutionProposal || ''
    },
    questions: {
      is_compliant: {
        type: 'noul',
        instruction: 'Does the solution proposal fully satisfy all requirements and constraints stated in the clause?'
      }
    }
  };

  const evalResult = await jevClient.evaluate(payload);
  const isCompliant = evalResult.answers.is_compliant || { probability: 0.5 };

  const passed = isCompliant.probability >= 0.70;

  return {
    gateway: 'D_COMPLIANCE',
    status: passed ? 'passed' : 'non_compliant',
    complianceProbability: isCompliant.probability,
    passed,
    latencyMs: evalResult.latencyMs
  };
}
