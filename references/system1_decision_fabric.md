# System 1 Decision Fabric (Jev by TypeSafe)

The **System 1 Decision Fabric** is the enterprise-wide reflex layer of Paperclip AI (`HJ-Company-Limited`), governed by the **SystemOne Engineer** (`436b6774-90b8-44fb-b51b-4d1018acee29`).

Unlike System 2 agents that perform heavy generative coding and open-ended text synthesis, Jev operates as an ultra-fast, deterministic reflex system embedded directly in the harness and gateways of every role.

---

## 1. The 3-Tier Calibrated Confidence Gate

All Jev decisions return calibrated probability distributions. The Paperclip orchestrator enforces a 3-tier execution policy:

| Confidence Tier | Criteria | Orchestration Action | Latency / SLA |
| :--- | :--- | :--- | :--- |
| **Tier 1: Fast Path** | $\text{Confidence} \ge 0.85$ | Automatic execution in code; no human delay | 70–100 ms |
| **Tier 2: Escalation** | $0.50 \le \text{Confidence} < 0.85$ | Context enrichment, retry, or handoff to senior agent | 1–3 s |
| **Tier 3: Board Gate** | $\text{Confidence} < 0.50$ or high-risk action | Suspends execution; raises ticket to **Paperclip Board Approval Gate** | Human review |

---

## 2. The 5 Decision Gateways (5-Pillar Decision Mesh)

### Gateway A: Ingestion & Model Selection Router (80% Token Cost Reduction)
Intercepts newly created tickets/issues to determine the optimal assignee and appropriate model tier:

```json
{
  "state": {
    "ticket_id": "HJC-102",
    "description": "Need to update API rate limit response header from X-RateLimit to RateLimit-Limit according to RFC 8966."
  },
  "questions": {
    "assignee": {
      "type": "choice",
      "instruction": "Which role should handle this ticket?",
      "criteria": {
        "backend_engineer": "API logic, endpoint responses, HTTP headers, backend code.",
        "devops_engineer": "Infrastructure, CI/CD, deployment pipelines, server config.",
        "frontend_engineer": "UI components, CSS, client-side rendering.",
        "other": "Does not fit technical engineering roles."
      }
    },
    "complexity_score": {
      "type": "score",
      "instruction": "Rate the technical complexity and risk of this change.",
      "criteria": {
        "0": "Trivial single-line code or config edit.",
        "1": "Standard minor feature or straightforward bug fix.",
        "2": "Complex refactoring or cross-service change.",
        "3": "Critical architecture redesign or high risk."
      }
    }
  }
}
```

**Jev Output (~90ms):**
```json
{
  "answers": {
    "assignee": { "selected": "backend_engineer", "confidence": 0.96 },
    "complexity_score": { "expected_value": 0.12, "confidence": 0.94 }
  }
}
```
*Action*: Complexity $\le 1$ routes to fast local model (`opencode-go/muse-spark-1.3-contributor`), bypassing costly high-tier reasoning models.

---

### Gateway B: Budget & Token Cost Guardrail (CFO Collaboration)
Pre-flight check before triggering resource-intensive LLM reasoning batches:

```json
{
  "state": {
    "agent_id": "ai-systems-engineer",
    "requested_operation": "Batch document embedding and multi-vector rerank over 500 documents",
    "estimated_cost_cents": 450,
    "remaining_monthly_budgetCents": 800
  },
  "questions": {
    "within_budget": {
      "type": "noul",
      "instruction": "Is the requested token operation within the authorized task budget threshold?"
    },
    "action_gate": {
      "type": "choice",
      "instruction": "What budget action should be taken?",
      "criteria": {
        "allow": "Expenditure is justified and well within limits.",
        "throttle": "Reduce batch size to preserve budget.",
        "escalate_to_cfo": "Requires CFO financial approval before execution."
      }
    }
  }
}
```

---

### Gateway C: Security & Tool Safety Gate (100% Error Prevention)
Guards shell execution, DB queries, and filesystem modifications across DevOps, SRE, and Backend:

```json
{
  "state": {
    "agent_role": "DevOps Engineer",
    "environment": "production",
    "proposed_command": "DROP TABLE temp_user_migration_v2;"
  },
  "questions": {
    "is_destructive": {
      "type": "noul",
      "instruction": "Is this proposed command destructive or irreversible to data in production?"
    },
    "action_gate": {
      "type": "choice",
      "instruction": "What safety action should the Paperclip harness take?",
      "criteria": {
        "allow": "Safe read-only commands, tests, or minor scripts.",
        "block": "Violates explicit safety policy.",
        "escalate_to_board": "Destructive or high-risk actions requiring human approval."
      }
    }
  }
}
```

**Jev Output:**
```json
{
  "answers": {
    "is_destructive": { "probability": 0.98 },
    "action_gate": { "selected": "escalate_to_board", "confidence": 0.95 }
  }
}
```
*Action*: Suspends execution; raises an interactive approval request to the **Board** via Paperclip AI.

---

### Gateway D: Spec & Compliance Verification Gate (Presales & Legal)
Scans government TOR clauses (e-GP / DGA / GDCC) and legal policies (PDPA):

```json
{
  "state": {
    "tor_clause_text": "ผู้เสนอราคาต้องจัดเก็บข้อมูลจราจรทางคอมพิวเตอร์ตาม พ.ร.บ. คอมพิวเตอร์ ไม่น้อยกว่า 90 วัน และต้องรองรับการจัดเก็บในระบบ Cloud ของ GDCC",
    "solution_proposal": "System uses AWS CloudWatch logs configured with a 30-day retention policy."
  },
  "questions": {
    "is_compliant": {
      "type": "noul",
      "instruction": "Does the solution proposal fully satisfy both the 90-day retention requirement and the GDCC cloud storage constraint?"
    }
  }
}
```

**Jev Output:**
```json
{
  "answers": {
    "is_compliant": { "probability": 0.04 }
  }
}
```
*Action*: Alerts the **Thai Presales Engineer** immediately that the proposal fails the 90-day retention and GDCC hosting criteria.

---

### Gateway E: Code Quality & PR Evaluator (CTO & QA Collaboration)
Evaluates test runs, linting, and diff complexity before closing an issue:

```json
{
  "state": {
    "issue_id": "HJC-45",
    "test_results": "35 passed, 0 failed, 100% assertions met",
    "git_diff_summary": "+45 lines, -12 lines in auth/token_verifier.ts",
    "documentation_updated": true
  },
  "questions": {
    "is_release_ready": {
      "type": "noul",
      "instruction": "Is the code complete, properly tested, documented, and safe for automated merge?"
    },
    "quality_score": {
      "type": "score",
      "instruction": "Rate the overall engineering quality of this submission.",
      "criteria": {
        "0": "Incomplete, failing tests, or missing documentation.",
        "1": "Marginal, requires senior code review.",
        "2": "Meets enterprise quality standards.",
        "3": "Exemplary code, test, and documentation quality."
      }
    }
  }
}
```
