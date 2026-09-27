/**
 * Gateway E: Code Quality & PR Evaluator
 * Verifies test results and diff quality before automated issue closure.
 */

export async function runGatewayE(jevClient, prContext) {
  const payload = {
    state: {
      issue_id: prContext.issueId || 'unknown',
      test_results: prContext.testResults || 'no test logs provided',
      git_diff_summary: prContext.gitDiffSummary || '',
      documentation_updated: Boolean(prContext.documentationUpdated)
    },
    questions: {
      is_release_ready: {
        type: 'noul',
        instruction: 'Is the code complete, properly tested, documented, and safe for automated merge?'
      },
      quality_score: {
        type: 'score',
        instruction: 'Rate the overall engineering quality of this submission.',
        criteria: {
          '0': 'Incomplete, failing tests, or missing documentation.',
          '1': 'Marginal, requires senior code review.',
          '2': 'Meets enterprise quality standards.',
          '3': 'Exemplary code, test, and documentation quality.'
        }
      }
    }
  };

  const evalResult = await jevClient.evaluate(payload);
  const releaseReady = evalResult.answers.is_release_ready || { probability: 0.5 };
  const quality = evalResult.answers.quality_score || { expected_value: 1.0, confidence: 0.7 };

  const passed = releaseReady.probability >= 0.80 && quality.expected_value >= 1.5;

  return {
    gateway: 'E_QUALITY',
    status: passed ? 'passed' : 'needs_revision',
    releaseReadyProb: releaseReady.probability,
    qualityScore: quality.expected_value,
    confidence: quality.confidence,
    passed,
    latencyMs: evalResult.latencyMs
  };
}
