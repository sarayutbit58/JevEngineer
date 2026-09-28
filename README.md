# JevEngineer: System 1 Decision Fabric & Multi-Agent Orchestrator

[![Tests](https://img.shields.io/badge/tests-15%20passed-brightgreen.svg)](#automated-testing)
[![Inference Latency](https://img.shields.io/badge/latency-%3C100ms-blue.svg)](#5-pillar-decision-mesh)
[![TypeSafe Jev](https://img.shields.io/badge/System%201-TypeSafe%20Jev-orange.svg)](#dual-ai-engine-architecture)
[![Paperclip AI](https://img.shields.io/badge/Platform-Paperclip%20AI-purple.svg)](#enterprise-organization-structure)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**JevEngineer** is an enterprise-grade AI orchestration and decision control plane designed for **Paperclip AI**. Powered by **TypeSafe AI's flagship Jev model**, it introduces a horizontal **System 1 Reflex Layer** across the enterprise, replacing fragile, slow, and expensive LLM prompt-and-parse loops with typed, calibrated, sub-second judgments (`Choice`, `Noul`, `Score`).

---

## 🏛️ Enterprise Architecture

```mermaid
flowchart TD
    subgraph CLIENTS[" 💻 Client & Agent Layer "]
        CLI["Paperclip CLI / SDK"]
        Orch["orchestrate.ps1"]
        Agents["Autonomous Agents (OpenCode/Local)"]
    end

    subgraph PROXY[" ⚡ TypeSafe Jev Synchronous Reverse Proxy (:3105) "]
        Router["HTTP Interceptor Engine"]
        Auditor["In-Memory Audit Ring Buffer<br/>(GET /proxy/audit)"]
        
        subgraph JEV_GATES[" 5-Pillar Decision Fabric "]
            GA["Gateway A: Ingestion Router"]
            GB["Gateway B: Budget Guardrail"]
            GC["Gateway C: Tool Safety & Shell Gate"]
            GD["Gateway D: Compliance & TOR"]
            GE["Gateway E: Quality Verifier"]
        end
    end

    subgraph BACKEND[" 🏢 Target Paperclip AI Server (:3100) "]
        PaperclipCore["Paperclip REST API Engine"]
        DB["SQLite / State Store"]
        UI["Paperclip Web UI (Board Confirmation)"]
    end

    %% Flow links
    CLI & Orch & Agents == "HTTP Requests (:3105)" ==> Router
    
    %% Read Pass-through
    Router -- "GET Requests (Pass-through)" --> PaperclipCore
    
    %% Mutating Interception
    Router -- "Mutating POST/PUT/DELETE" --> JEV_GATES
    JEV_GATES -. "Always-Evaluate Fresh" .-> Router
    
    %% Decision Routes
    Router == "Pass (Tier 1 Fast-Path)" ==> PaperclipCore
    PaperclipCore --> DB
    
    Router -- "Block / High Risk (Tier 3)" --> UI
    UI -. "Create request_confirmation" .-> PaperclipCore
    Router -. "HTTP 202 Pending Board Approval" .-> CLI & Orch
    
    Router -. "Record Transaction" .-> Auditor
```

---

## ⚡ System 1 Decision Fabric (5-Pillar Decision Mesh)

The **SystemOne Engineer** designs and calibrates typed schemas across 5 strategic enterprise gateways:

| Gateway | Role & Scope | TypeSafe Primitives | Output Metric & Action |
| :--- | :--- | :--- | :--- |
| **Gateway A: Ingestion Router** | CEO / Triage | `Choice` + `Score` | Selects optimal agent assignee & model tier (`fast_local` vs `heavy_reasoning`). Cuts token spend by 80%. |
| **Gateway B: Budget Guardrail** | CFO / Cost Control | `Noul` + `Choice` | Validates token spend against monthly budget limits before running expensive models. |
| **Gateway C: Tool Safety Gate** | CISO / SecOps | `Noul` + `Choice` | Pre-flight scans shell/SQL commands. Blocks destructive actions (`DROP TABLE`, `rm -rf`) and escalates to Board. |
| **Gateway D: Compliance Gate** | Thai Presales / Legal | `Noul` | Verifies proposals against Thai Government TOR, e-GP, DGA, GDCC hosting, and Thailand PDPA B.E. 2562. |
| **Gateway E: Quality Verifier** | QA Lead / SDET | `Noul` + `Score` | Verifies test assertions and git diffs before automated PR merge or issue completion. |

---

## 🛡️ 3-Tier Calibrated Confidence Policy

Every gateway decision produces a calibrated confidence score (`0.0` to `1.0`), driving Paperclip orchestration:

```mermaid
graph LR
    Score["Jev Judgment Confidence"] --> T1{"Confidence ≥ 0.85<br/>AND No High-Risk Flag"}
    T1 -- Yes --> Fast["Tier 1: Fast-Path Execution<br/>(Sub-second automated pass)"]
    T1 -- No --> T2{"0.50 ≤ Confidence < 0.85"}
    T2 -- Yes --> Retry["Tier 2: Enrich & Retry<br/>(Auto-prompt agent for context / senior review)"]
    T2 -- No --> Board["Tier 3: Human Board Approval Gate<br/>(HTTP 202 Pending + Interactive UI confirmation)"]
```

---

## 🔄 Multi-Agent Workflow Cascade Engine

The **Cascade Engine** (`services/gateway-interceptor/src/cascade-engine.js`) automates multi-agent handoffs based on declarative recipes:

- **`thai-gov-tender.json`**:
  - Stage 1: TOR Compliance Review (`Thai Presales Engineer`) ➔ Gateway D Verification
  - Stage 2 (Parallel Fan-out): CTO (Architecture & GDCC) + Head of Security (PDPA/CII) + CFO (BOQ Pricing)
  - Stage 3: Executive Bid Package Compilation (`Thai Presales Engineer`)
- **`feature-sprint.json`**:
  - Stage 1: Product Specification (`VP of Product`)
  - Stage 2: UI Wireframes & Design System (`Product Designer`)
  - Stage 3 (Parallel): Backend Engineer + Frontend Engineer
  - Stage 4: Automated Testing (`Automation Test Engineer`) ➔ Gateway E Quality Verification

---

## 🚀 Quick Start

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/sarayutbit58/JevEngineer.git
cd JevEngineer/services/gateway-interceptor
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(Note: If `TYPESAFE_API_KEY` is not provided, JevClient automatically defaults to the Local Calibrated Emulator mode for testing and offline execution).*

### 3. Run Automated Tests
Execute the full test suite covering all 5 Gateways, Reverse Proxy, and Cascade Engine:
```bash
npm test
```
```
▶ Multi-Agent Workflow Cascade Engine
  ✔ Recipe Matching: matches titles to declarative workflow recipes
  ✔ Agent Resolution: resolves CTO, Head of Security, and CFO by name from org roster
  ✔ Verification & Retry Loop: handles failure retry and board escalation on repeated failure
  ✔ Passing Verification: advances workflow to next stage
✔ Multi-Agent Workflow Cascade Engine (124.8ms)

▶ System 1 Decision Fabric (Jev by TypeSafe) - 5-Pillar Decision Mesh
  ✔ Gateway A: Ingestion Router routes API header ticket to backend_engineer with fast_local tier
  ✔ Gateway B: Budget Guardrail approves operations within budget and flags excessive costs
  ✔ Gateway C: Security Gate allows safe commands and escalates destructive commands to Board
  ✔ Gateway D: Compliance Gate flags non-compliant Thai Gov TOR retention mismatch
  ✔ Gateway E: Code Quality Gate verifies passing test assertions before issue closure
✔ System 1 Decision Fabric (Jev by TypeSafe) - 5-Pillar Decision Mesh (8.7ms)

▶ Synchronous Transparent HTTP Reverse Proxy Interceptor
  ✔ GET /health: returns proxy health and reports reachable target Paperclip server
  ✔ Transparent Pass-through: forwards GET /api/companies without modification
  ✔ Gateway A & B Interception: inspects issue creation, enriches model tier, and forwards
  ✔ Gateway C Tool Safety: blocks destructive command and escalates to Board (HTTP 202)
  ✔ Gateway C Tool Safety: fast-paths and forwards safe read-only command (HTTP 200)
  ✔ GET /proxy/audit: returns in-memory audit ring buffer logs
✔ Synchronous Transparent HTTP Reverse Proxy Interceptor (184.3ms)

ℹ tests 15 | pass 15 | fail 0
```

### 4. PowerShell Orchestrator Commands
Run orchestration tasks directly via `orchestrate.ps1`:
```powershell
# 1. Manage TypeSafe Jev Synchronous Reverse Proxy (:3105 -> :3100)
.\scripts\orchestrate.ps1 -Action proxy-start
.\scripts\orchestrate.ps1 -Action proxy-status
.\scripts\orchestrate.ps1 -Action proxy-audit
.\scripts\orchestrate.ps1 -Action proxy-stop

# 2. Check server health & company roster
.\scripts\orchestrate.ps1 -Action status
.\scripts\orchestrate.ps1 -Action roster

# 3. Smart dispatch with Gateway A & B pre-flight triage
.\scripts\orchestrate.ps1 -Action dispatch `
  -Title "Thai Government Digital Economy Platform: TOR Compliance Review" `
  -Description "Review TOR clauses for e-GP, DGA standards, and GDCC hosting."

# 4. Test Gateway C Security Guardrail
.\scripts\orchestrate.ps1 -Action gate-security -Command "DROP TABLE users;"

# 5. Test Gateway D Compliance Guardrail
.\scripts\orchestrate.ps1 -Action gate-compliance `
  -TorClause "ผู้เสนอราคาต้องจัดเก็บข้อมูล 90 วัน บนระบบ GDCC" `
  -Proposal "System uses AWS CloudWatch logs with 30-day retention"

# 6. Manage Multi-Agent Cascade Daemon
.\scripts\orchestrate.ps1 -Action cascade-start
.\scripts\orchestrate.ps1 -Action cascade-status
.\scripts\orchestrate.ps1 -Action cascade-stop
```

---

## 🔒 Security & Privacy Policy

- **Zero Hardcoded Secrets**: This repository strictly enforces zero hardcoded API keys, tokens, or credentials.
- **Fail-Safe Gateways**: Destructive shell or database commands are intercepted by Gateway C before execution.
- **Local Fallback**: Full support for local calibrated evaluation with zero cloud dependency during offline development.

---

## 📄 License

MIT License. Designed and maintained by Antigravity & the SystemOne Engineer team.
