/**
 * Hybrid Approval Handler
 * Enforces the 3-Tier Calibrated Confidence policy and links directly to Paperclip UI & Antigravity.
 */

export class ApprovalHandler {
  constructor(options = {}) {
    this.apiBase = options.apiBase || 'http://127.0.0.1:3100';
    this.companyId = options.companyId || 'ba9c8f2b-7942-4917-aae5-8320e3a9a7c7';
  }

  /**
   * Evaluate a gateway result against the 3-tier confidence policy
   * @param {Object} gatewayResult
   * @param {Object} context { issueId, description }
   */
  async handleDecision(gatewayResult, context = {}) {
    const confidence = gatewayResult.confidence ?? gatewayResult.assigneeConfidence ?? 0.9;
    const isDestructive = gatewayResult.isDestructiveProb && gatewayResult.isDestructiveProb > 0.5;

    // Tier 1: Fast Path
    if (confidence >= 0.85 && !isDestructive && gatewayResult.status === 'passed') {
      return {
        action: 'EXECUTE_FAST_PATH',
        tier: 1,
        confidence,
        reason: 'Confidence exceeds 0.85 and no policy violations detected.'
      };
    }

    // Tier 2: Retry / Senior Escalation
    if (confidence >= 0.50 && confidence < 0.85 && !isDestructive) {
      return {
        action: 'ENRICH_AND_RETRY',
        tier: 2,
        confidence,
        reason: 'Confidence between 0.50 and 0.85; requires context enrichment or senior peer review.'
      };
    }

    // Tier 3: Board Approval Gate (Low confidence or High risk)
    const reason = isDestructive
      ? `Destructive command detected (Risk Prob: ${gatewayResult.isDestructiveProb}).`
      : `Low decision confidence (${confidence}) requires human board confirmation.`;

    const escalation = {
      action: 'ESCALATE_TO_BOARD',
      tier: 3,
      confidence,
      reason,
      paperclipInteraction: null
    };

    // If an active issueId is provided, raise an interactive request_confirmation in Paperclip
    if (context.issueId) {
      try {
        const interactionPayload = {
          kind: 'request_confirmation',
          title: 'High-Risk / Low-Confidence Board Approval Required',
          description: `Gateway ${gatewayResult.gateway} flagged an action: ${reason}\n\nProposed Command / Context:\n${JSON.stringify(context, null, 2)}`
        };

        const res = await fetch(`${this.apiBase}/api/issues/${context.issueId}/interactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(interactionPayload)
        });

        if (res.ok) {
          const interaction = await res.json();
          escalation.paperclipInteraction = interaction;
        }
      } catch (err) {
        console.warn(`[ApprovalHandler] Could not post interaction to Paperclip UI: ${err.message}`);
      }
    }

    return escalation;
  }
}
