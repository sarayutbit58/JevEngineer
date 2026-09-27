---
name: paperclipai-orchestrator
description: Orchestrate, command, dispatch tasks to, and monitor autonomous AI agents in Paperclip AI (paperclipai). Use this skill whenever the user asks to command, delegate to, monitor, manage, or query the Paperclip AI corporate hierarchy (CEO, CTO, VP of Product, CMO, Thai Presales Engineer, SystemOne Engineer, engineers, QA, DevOps), create or assign issues in Paperclip, invoke agent heartbeats, run live execution loops, or inspect agent logs and status.
---

# Paperclip AI Orchestrator

This skill enables Antigravity to act as the **Board of Directors / Primary Executive Orchestrator** commanding the autonomous company in **Paperclip AI** (`HJ-Company-Limited`, Company ID: `ba9c8f2b-7942-4917-aae5-8320e3a9a7c7`).

## Environment Snapshot

- **Server URL**: `http://127.0.0.1:3100`
- **Active Company**: `HJ-Company-Limited` (`ba9c8f2b-7942-4917-aae5-8320e3a9a7c7`)
- **CLI Context Profile**: `default` (Persona: `board`)
- **Default Adapter**: `opencode_local`
- **Model**: `opencode-go/muse-spark-1.3-contributor`
- **Org Roster**: 23 Agents (See [org_roster.json](file:///C:/Users/mini_/.gemini/config/skills/paperclipai-orchestrator/references/org_roster.json))
- **Decision Fabric**: [system1_decision_fabric.md](file:///C:/Users/mini_/.gemini/config/skills/paperclipai-orchestrator/references/system1_decision_fabric.md)

---

## 1. Enterprise 3-Tier Architecture & Organization Chart

```mermaid
flowchart TD
    subgraph GOV[" Governance & Management Layer (Paperclip AI) "]
        Board["Board of Directors / Human Operator"]
        CEO["CEO Agent"]
        CFO["CFO Agent"]
    end

    subgraph S1_MESH[" ⚡ System 1 Decision Fabric (Jev Primitives Engine) "]
        S1_Lead["⚡ SystemOne Engineer<br/>(Schema Registry & Policy Calibration)"]
        J_Router["Gateway A: Ingestion & Model Router"]
        J_Budget["Gateway B: Budget & Cost Guardrail"]
        J_Sec["Gateway C: Security & Tool Safety Gate"]
        J_Doc["Gateway D: Spec & Compliance Verifier"]
        J_QA["Gateway E: Code Quality & PR Evaluator"]
    end

    subgraph WORKERS[" 🧠 System 2 Heavy Reasoning Workers (Agentic AI) "]
        CTO["CTO"]
        VPP["VP of Product"]
        CISO["Head of Security"]
        CMO["CMO"]

        %% CTO Branch
        CTO --> PE["Principal Engineer"]
        PE --> Backend["Backend Eng"]
        PE --> Frontend["Frontend Eng"]
        PE --> Mobile["Mobile Eng"]
        PE --> AI_Sys["AI Systems Eng (RAG/LLM)"]
        
        CTO --> DevOps["DevOps Lead"]
        DevOps --> SRE["SRE"]
        DevOps --> DBA["DBA"]

        CTO --> QA["QA Lead"]
        QA --> SDET["SDET Eng"]

        %% Product Branch
        VPP --> Designer["Product Designer"]
        VPP --> Writer["Tech Writer"]

        %% Security Branch
        CISO --> SecOps["SecOps Analyst"]

        %% Commercial Branch
        CMO --> ThaiPresales["Thai Presales Eng"]
        CMO --> DevRel["DevRel Eng"]
    end

    %% Routing & Links
    Board <==> CEO
    CEO --> CFO
    CEO --> CTO & VPP & CISO & CMO

    %% SystemOne Control Links
    S1_Lead -. Design Schemas .-> J_Router & J_Budget & J_Sec & J_Doc & J_QA

    %% Jev Interventions
    J_Router -. 1. Route Ticket & Select Model .-> CEO
    J_Budget -. 2. Token Budget Gate .-> CFO
    J_Sec -. 3. Command/SQL Gate .-> SecOps & DevOps & Backend
    J_Doc -. 4. TOR/PDPA Clause Check .-> ThaiPresales & Writer
    J_QA -. 5. PR & Test Verification .-> SDET & PE

    %% Escalation to Board
    J_Sec & J_Budget -. Confidence < 0.50 Escalation .-> Board
```

---

## 2. ⚡ The 5-Pillar Decision Mesh (Jev by TypeSafe)

Governed by the **SystemOne Engineer** (`436b6774-90b8-44fb-b51b-4d1018acee29`), the reflex layer evaluates task context in 70–100ms:

| Gateway | Name & Purpose | Primary Primitives | Impact / Benefit |
| :--- | :--- | :--- | :--- |
| **Gateway A** | **Ingestion & Model Selection Router** | `Choice` (assignee), `Score` (complexity) | Cuts token cost by 80% by routing simple tasks to fast/local models |
| **Gateway B** | **Token Budget & Cost Guardrail** | `Noul` (within budget), `Choice` (throttle/escalate) | Eliminates budget overruns before calling heavy LLMs |
| **Gateway C** | **Security & Tool Safety Gate** | `Noul` (is destructive), `Choice` (safety action) | 100% prevention of accidental production data loss or harmful SQL/shell execution |
| **Gateway D** | **Spec & Compliance Verification Gate** | `Noul` (is compliant) | Instant verification of Thai Gov TOR clauses (e-GP/DGA/GDCC/PDPA) |
| **Gateway E** | **Code Quality & PR Evaluator** | `Noul` (tests passing), `Score` (quality score) | Guarantees test and lint pass before automated ticket closure |

### Calibrated Confidence Score Policy
- **$\ge 0.85$ (Fast Path)**: Automates execution immediately in code; zero delay.
- **$0.50 \le \text{Confidence} < 0.85$ (Escalate / Retry)**: Refines context or escalates to senior agent.
- **$< 0.50$ (Human Approval Gate)**: Suspends action and routes interactive approval to the Board in Paperclip UI.

---

## 3. Quick Dispatch Matrix

| Domain / Initiative | Primary Agent | Agent ID | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **System 1 Decision Fabric & Schema Registry** | **SystemOne Engineer** | `436b6774-90b8-44fb-b51b-4d1018acee29` | Designs schemas & policies across all 5 Gateways (A–E) using Jev primitives |
| **Corporate Vision & Strategy** | **CEO** | `28852e11-2b59-403c-aad1-94623d09748a` | Decomposes high-level goals into executive child tasks |
| **Thai Gov TOR / Tender / Presales** | **Thai Presales Engineer** | `c12f7855-0f2c-4b1a-82c1-e4e517288364` | TOR compliance, Thai e-GP, DGA/GDCC standards, BOQ |
| **Technical Architecture & Infra** | **CTO** | `609564fa-dcc5-4109-aa38-4b6d93eb2c1c` | High-level system design, tech stack governance |
| **Product Specs & Roadmap** | **VP of Product** | `30b68b4e-a87d-4c1c-ac86-a457803b272e` | PRDs, feature prioritization, user stories |
| **Lead Architecture / Full Stack** | **Principal Engineer** | `0c619c25-94ca-46a9-a91f-cb951560f657` | Codebase architecture, API contracts, cross-team eng |
| **Frontend UI / Client** | **Frontend Engineer** | `37b42df4-95fa-442b-be92-43ce2d4f1720` | React, UI components, state management, web performance |
| **Backend APIs & Microservices** | **Backend Engineer** | `fd1fefcc-9552-4a97-8e9d-c8f9bca6a2cd` | Node/Python/Go APIs, database queries, business logic |
| **Mobile Apps (iOS/Android)** | **Mobile App Engineer** | `4dbc1090-28e1-447f-aba4-dd667b685bcb` | Flutter / React Native, offline storage, mobile UX |
| **AI / RAG / Embeddings** | **AI Systems Engineer** | `9fcbf9ce-007f-41c3-a2b6-71223db4f07e` | Vector databases, RAG pipelines, LLM tuning |
| **DevOps / CI/CD / Kubernetes** | **DevOps Lead** | `f8d23a98-6260-413d-a8f9-2bbe50469def` | CI/CD pipelines, Docker, K8s, Cloud Run, IaC |
| **Site Reliability & Uptime** | **Site Reliability Engineer** | `f3985b39-28f5-4bb1-9884-871b07626fe7` | SLOs, observability, alerts, failover |
| **Database Administration** | **Database Administrator** | `217c3041-8e8c-4010-8a1e-8c5d21b15cc2` | PostgreSQL/SQLite schemas, indexing, migrations |
| **Security, PDPA & Compliance** | **Head of Security** | `c0a14a7c-5153-4942-81fd-f07f3f3ffae4` | CISO duties, threat modeling, PDPA/GDPR compliance |
| **SecOps & Vulnerabilities** | **Security Operations Analyst** | `f9f4f75a-6030-45c0-afe5-cceb14271f8a` | Vulnerability assessment, audit logging, pen testing |
| **QA Leadership & Strategy** | **QA Lead** | `5c60af4b-fe06-40e1-8c5b-b19c16eac787` | Test plans, acceptance criteria, coverage review |
| **Automated Testing & Vitest** | **Automation Test Engineer** | `5bcb7ebb-6604-4db9-b1e5-c9be5c90ccfd` | E2E, unit tests, regression suites |
| **UI/UX Design & Design System** | **Product Designer** | `b647e250-e2cc-4721-b8bd-d6d21faef3bb` | Wireframes, Figma specs, accessibility |
| **Documentation & Tech Specs** | **Technical Writer** | `c31bdc01-de0c-4107-bd26-b37c11c32cf9` | API docs, user manuals, READMEs, runbooks |
| **Emerging Tech Research** | **Tech Researcher** | `9925a05b-7687-4b1b-8c1e-c510571d6b38` | Benchmarking, tech evaluations, proof of concepts |
| **DevRel & Community** | **Developer Advocate** | `c76a7275-900a-471b-a1b0-31771f71628c` | Tutorials, sample repos, technical articles |
| **Marketing & Growth** | **CMO** | `34f8322f-4b9e-436a-87b4-c3d0dc823ebb` | Marketing campaigns, GTM strategy, brand positioning |
| **Financial Modeling & Budget** | **CFO** | `a700d817-ed15-4752-8a6b-5d9b962d52d1` | Cost analysis, runway, pricing strategy, BOQ budgets |

---

## 4. Standard Operating Procedures (SOP)

### SOP 1: Dispatching a Task (With Gateway A Triage)
1. **System 1 Triage**: Evaluate complexity with Gateway A schema.
2. **Issue Creation**:
   ```bash
   paperclipai issue create -C ba9c8f2b-7942-4917-aae5-8320e3a9a7c7 \
     --title "<Title>" \
     --description "<Detailed Scope and Acceptance Criteria>" \
     --assignee-agent-id <agentId> \
     --priority high \
     --status todo \
     --json
   ```
   *Or with helper script:*
   ```powershell
   powershell -ExecutionPolicy Bypass -File "C:\Users\mini_\.gemini\config\skills\paperclipai-orchestrator\scripts\orchestrate.ps1" -Action dispatch -AgentName "<Name>" -Title "<Title>" -Description "<Desc>"
   ```
3. **Heartbeat Wakeup**:
   ```bash
   paperclipai agent heartbeat:invoke <agentId>
   ```

### SOP 2: Handling High-Risk Approvals (Gateway C Gate)
When Jev scores an action as destructive (`is_destructive.probability > 0.80`) or confidence $< 0.50$:
1. The issue pauses and creates an approval request.
2. Board reviews via:
   ```bash
   paperclipai issue approvals <issueId>
   ```
3. To approve:
   ```bash
   paperclipai issue interaction:respond <issueId> <interactionId> --body "Approved by Board: proceed with migration."
   ```

### SOP 3: Running the Multi-Agent Workflow Cascade
1. **Start the Cascade Daemon**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File "scripts/orchestrate.ps1" -Action cascade-start
   ```
2. **Monitor Cascade Status**:
   ```powershell
   powershell -ExecutionPolicy Bypass -File "scripts/orchestrate.ps1" -Action cascade-status
   ```
3. **Automated Stage Advancement & Retry Loop**:
   - The daemon monitors Paperclip AI every 3 seconds for completed issues.
   - Evaluates deliverables with **Gateway D** (Compliance) or **Gateway E** (Quality).
   - If non-compliant: posts retry notice and wakes the agent (`maxRetries = 2`). If repeated failure occurs, escalates to the Board.
   - If compliant: automatically spawns child tasks (parallel fan-out or sequential) in Paperclip AI and wakes downstream agents.

---

## 5. Workflow Recipes Catalog

Declarative templates located in [`services/gateway-interceptor/workflows/`](file:///C:/Users/mini_/.gemini/config/skills/paperclipai-orchestrator/services/gateway-interceptor/workflows/):
- **`thai-gov-tender.json`**:
  - Stage 1: TOR Review (`Thai Presales Engineer`) ➔ Gateway D Verification
  - Stage 2 (Parallel Fan-out): CTO (Architecture & GDCC) + Head of Security (PDPA/CII) + CFO (BOQ Pricing)
  - Stage 3: Bid Deck Compilation (`Thai Presales Engineer`)
- **`feature-sprint.json`**:
  - Stage 1: Product Specs (`VP of Product`)
  - Stage 2: UI Wireframes (`Product Designer`)
  - Stage 3 (Parallel): Backend Engineer + Frontend Engineer
  - Stage 4: Automated Testing (`Automation Test Engineer`) ➔ Gateway E Quality Verification

---

## 6. Reference Files

- [system1_decision_fabric.md](file:///C:/Users/mini_/.gemini/config/skills/paperclipai-orchestrator/references/system1_decision_fabric.md) - Complete 5 Gateways JSON schemas and confidence gating rules.
- [org_roster.json](file:///C:/Users/mini_/.gemini/config/skills/paperclipai-orchestrator/references/org_roster.json) - Full catalog of 23 agents, roles, and reporting hierarchy.
- [cli_reference.md](file:///C:/Users/mini_/.gemini/config/skills/paperclipai-orchestrator/references/cli_reference.md) - CLI command guide and REST API endpoints.
- [dispatch_workflows.md](file:///C:/Users/mini_/.gemini/config/skills/paperclipai-orchestrator/references/dispatch_workflows.md) - Detailed workflow templates.
- [orchestrate.ps1](file:///C:/Users/mini_/.gemini/config/skills/paperclipai-orchestrator/scripts/orchestrate.ps1) - Automation script.
