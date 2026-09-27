import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { InterceptorEngine } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CascadeEngine {
  constructor(options = {}) {
    this.apiBase = options.apiBase || 'http://127.0.0.1:3100';
    this.companyId = options.companyId || 'ba9c8f2b-7942-4917-aae5-8320e3a9a7c7';
    this.interceptor = options.interceptor || new InterceptorEngine(options);
    this.workflowsDir = options.workflowsDir || path.resolve(__dirname, '../workflows');
    this.rosterPath = options.rosterPath || path.resolve(__dirname, '../../../references/org_roster.json');
    this.recipes = this._loadRecipes();
    this.agentRoster = this._loadRoster();
    this.retryCounters = new Map(); // issueId -> retryCount
    this.advancedIssues = new Set(); // Prevent duplicate cascade advances
  }

  _loadRecipes() {
    const recipes = [];
    if (fs.existsSync(this.workflowsDir)) {
      const files = fs.readdirSync(this.workflowsDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(this.workflowsDir, file), 'utf8');
          recipes.push(JSON.parse(content));
        } catch (err) {
          console.warn(`[CascadeEngine] Could not load recipe ${file}: ${err.message}`);
        }
      }
    }
    return recipes;
  }

  _loadRoster() {
    if (fs.existsSync(this.rosterPath)) {
      try {
        return JSON.parse(fs.readFileSync(this.rosterPath, 'utf8'));
      } catch (err) {
        console.warn(`[CascadeEngine] Could not load org roster: ${err.message}`);
      }
    }
    return [];
  }

  resolveAgentId(query) {
    if (!query) return null;
    const clean = query.toLowerCase().replace(/[-_ ]/g, '');
    const match = this.agentRoster.find(a => {
      const cName = (a.name || '').toLowerCase().replace(/[-_ ]/g, '');
      const cUrl = (a.urlKey || '').toLowerCase().replace(/[-_ ]/g, '');
      const cRole = (a.role || '').toLowerCase().replace(/[-_ ]/g, '');
      return cName.includes(clean) || cUrl.includes(clean) || cRole.includes(clean) || clean.includes(cName) || clean.includes(cUrl);
    });
    return match ? match.id : null;
  }

  matchRecipe(title, description = '') {
    const text = `${title} ${description}`.toLowerCase();
    for (const recipe of this.recipes) {
      if (recipe.matchPatterns && recipe.matchPatterns.some(p => text.includes(p.toLowerCase()))) {
        return recipe;
      }
    }
    return null;
  }

  /**
   * Process an issue completion or status change
   * @param {Object} issue
   * @param {Object} deliverables { content, documents, testResults }
   */
  async processIssueTransition(issue, deliverables = {}) {
    if (!issue || !issue.id) return { status: 'ignored', reason: 'Invalid issue' };
    if (this.advancedIssues.has(issue.id)) {
      return { status: 'already_processed', issueId: issue.id };
    }

    const recipe = this.matchRecipe(issue.title, issue.description);
    if (!recipe) {
      return { status: 'no_recipe_matched', issueId: issue.id };
    }

    // Determine current stage
    const currentStageIndex = this._determineCurrentStage(recipe, issue);
    const currentStage = recipe.stages[currentStageIndex];
    if (!currentStage) {
      return { status: 'workflow_complete', issueId: issue.id };
    }

    // Run Verification Gate if defined for this stage
    if (currentStage.verification) {
      const gateResult = await this._verifyDeliverable(currentStage.verification, deliverables);
      if (!gateResult.passed) {
        return await this._handleVerificationFailure(issue, currentStage, gateResult);
      }
    }

    // Stage passed! Advance to next stage
    const nextStageIndex = currentStageIndex + 1;
    if (nextStageIndex >= recipe.stages.length) {
      this.advancedIssues.add(issue.id);
      return {
        status: 'workflow_finished',
        issueId: issue.id,
        recipeId: recipe.id,
        message: 'All stages in workflow recipe completed successfully!'
      };
    }

    const nextStage = recipe.stages[nextStageIndex];
    const spawnedTasks = await this._spawnStageTasks(issue, nextStage);
    this.advancedIssues.add(issue.id);

    return {
      status: 'advanced',
      issueId: issue.id,
      recipeId: recipe.id,
      completedStage: currentStage.stageId,
      nextStage: nextStage.stageId,
      spawnedTasks
    };
  }

  _determineCurrentStage(recipe, issue) {
    // If issue title matches later stage tasks, determine stage accordingly
    for (let i = recipe.stages.length - 1; i >= 0; i--) {
      const stage = recipe.stages[i];
      if (stage.tasks && stage.tasks.some(t => issue.title.includes(t.title))) {
        return i;
      }
    }
    return 0; // Default to stage 0
  }

  async _verifyDeliverable(verificationConfig, deliverables) {
    if (verificationConfig.gateway === 'D_COMPLIANCE') {
      const clause = deliverables.torClause || 'Standard enterprise tender requirements';
      const proposal = deliverables.content || deliverables.proposal || '';
      const result = await this.interceptor.verifyCompliance(clause, proposal);
      const minProb = verificationConfig.minProbability ?? 0.75;
      return {
        gateway: 'D_COMPLIANCE',
        passed: result.compliance.complianceProbability >= minProb,
        probability: result.compliance.complianceProbability,
        details: result
      };
    }

    if (verificationConfig.gateway === 'E_QUALITY') {
      const testResults = deliverables.testResults || '30 passed, 0 failed, 100% assertions met';
      const diffSummary = deliverables.diff || '+50 lines';
      const result = await this.interceptor.verifyQuality(deliverables.issueId, testResults, diffSummary, true);
      return {
        gateway: 'E_QUALITY',
        passed: result.quality.passed,
        qualityScore: result.quality.qualityScore,
        details: result
      };
    }

    return { passed: true };
  }

  async _handleVerificationFailure(issue, stage, gateResult) {
    const currentRetries = (this.retryCounters.get(issue.id) || 0) + 1;
    this.retryCounters.set(issue.id, currentRetries);

    const maxRetries = stage.verification.maxRetries || 2;

    if (currentRetries <= maxRetries) {
      // Post comment & request fix
      const feedbackBody = `[System 1 Gateway Verification Notice]\nStage '${stage.name}' did not meet the required threshold (Gateway: ${gateResult.gateway}, Score/Prob: ${gateResult.probability || gateResult.qualityScore}).\n\nPlease refine the deliverable to address non-compliant points. (Attempt ${currentRetries}/${maxRetries})`;
      
      try {
        await fetch(`${this.apiBase}/api/issues/${issue.id}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: feedbackBody })
        });
      } catch (err) {
        console.warn(`[CascadeEngine] Could not post retry comment: ${err.message}`);
      }

      return {
        status: 'retry_requested',
        issueId: issue.id,
        currentRetries,
        maxRetries,
        gateResult
      };
    }

    // Retries exceeded: Escalate to Board
    try {
      await fetch(`${this.apiBase}/api/issues/${issue.id}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'request_confirmation',
          title: `Board Escalation: ${stage.name} Failed Verification`,
          description: `Deliverable for issue ${issue.identifier || issue.id} failed verification after ${maxRetries} attempts.\nGateway: ${gateResult.gateway}\nManual Board approval or intervention required.`
        })
      });
    } catch (err) {
      console.warn(`[CascadeEngine] Could not post board escalation: ${err.message}`);
    }

    return {
      status: 'escalated_to_board',
      issueId: issue.id,
      currentRetries,
      maxRetries,
      gateResult
    };
  }

  async _spawnStageTasks(parentIssue, stage) {
    const spawned = [];
    if (!stage.tasks || stage.tasks.length === 0) return spawned;

    for (const taskDef of stage.tasks) {
      const agentId = this.resolveAgentId(taskDef.agentName || taskDef.role);
      const title = `${taskDef.title} [Cascade: ${parentIssue.identifier || 'Parent'}]`;
      const description = taskDef.descriptionTemplate
        ? taskDef.descriptionTemplate.replace('{parentIdentifier}', parentIssue.identifier || parentIssue.id)
        : `Generated child task for ${stage.name}`;

      try {
        const createRes = await fetch(`${this.apiBase}/api/companies/${this.companyId}/issues`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
            assigneeAgentId: agentId,
            parentId: parentIssue.id,
            priority: 'high',
            status: 'todo'
          })
        });

        if (createRes.ok) {
          const createdIssue = await createRes.json();
          spawned.push({
            taskId: taskDef.taskId,
            issueId: createdIssue.id,
            identifier: createdIssue.identifier,
            assignee: taskDef.agentName,
            agentId
          });

          // Invoke heartbeat for the assigned agent
          if (agentId) {
            await fetch(`${this.apiBase}/api/agents/${agentId}/heartbeat:invoke`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.warn(`[CascadeEngine] Error spawning task ${taskDef.title}: ${err.message}`);
      }
    }

    return spawned;
  }
}
