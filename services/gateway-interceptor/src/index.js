import { JevClient } from './jev-client.js';
import { ApprovalHandler } from './approval-handler.js';
import { runGatewayA } from './gateways/gateway-a-router.js';
import { runGatewayB } from './gateways/gateway-b-budget.js';
import { runGatewayC } from './gateways/gateway-c-security.js';
import { runGatewayD } from './gateways/gateway-d-compliance.js';
import { runGatewayE } from './gateways/gateway-e-quality.js';

export {
  JevClient,
  ApprovalHandler,
  runGatewayA,
  runGatewayB,
  runGatewayC,
  runGatewayD,
  runGatewayE
};

export class InterceptorEngine {
  constructor(options = {}) {
    this.client = new JevClient(options);
    this.approval = new ApprovalHandler(options);
  }

  /**
   * Gateway A & B: Triage incoming task & check budget
   */
  async triageTask(ticket, budgetContext = {}) {
    const route = await runGatewayA(this.client, ticket);
    const budget = await runGatewayB(this.client, {
      agentId: route.selectedAssignee,
      operation: ticket.title,
      estimatedCostCents: budgetContext.estimatedCostCents || 10,
      remainingMonthlyBudgetCents: budgetContext.remainingMonthlyBudgetCents ?? 1000
    });

    const decision = await this.approval.handleDecision(route, { issueId: ticket.id, title: ticket.title });
    return {
      route,
      budget,
      decision,
      totalLatencyMs: route.latencyMs + budget.latencyMs
    };
  }

  /**
   * Gateway C: Guard tool or shell command execution
   */
  async guardExecution(command, agentRole = 'engineer', env = 'production', issueId = null) {
    const security = await runGatewayC(this.client, {
      command,
      agentRole,
      environment: env
    });

    const decision = await this.approval.handleDecision(security, { issueId, command, agentRole, env });
    return {
      security,
      decision,
      latencyMs: security.latencyMs
    };
  }

  /**
   * Gateway D: Verify proposal against TOR clause
   */
  async verifyCompliance(torClause, solutionProposal) {
    const compliance = await runGatewayD(this.client, { torClause, solutionProposal });
    const decision = await this.approval.handleDecision(compliance);
    return {
      compliance,
      decision,
      latencyMs: compliance.latencyMs
    };
  }

  /**
   * Gateway E: Verify code & test quality before issue close
   */
  async verifyQuality(issueId, testResults, gitDiffSummary, documentationUpdated = true) {
    const quality = await runGatewayE(this.client, {
      issueId,
      testResults,
      gitDiffSummary,
      documentationUpdated
    });

    const decision = await this.approval.handleDecision(quality, { issueId });
    return {
      quality,
      decision,
      latencyMs: quality.latencyMs
    };
  }
}
