# Enterprise Dispatch Workflows

This guide describes the standard orchestration patterns when dispatching user initiatives to Paperclip AI agents in **HJ-Company-Limited** (`ba9c8f2b-7942-4917-aae5-8320e3a9a7c7`).

---

## 1. System One (TypeSafe / Jev) Workflow Optimization & Acceleration

### Key Agents
- **Lead Assignee**: SystemOne Engineer (`436b6774-90b8-44fb-b51b-4d1018acee29`)
- **Collaborating Leads**: Principal Engineer (`0c619c25-94ca-46a9-a91f-cb951560f657`), Backend Engineer (`fd1fefcc-9552-4a97-8e9d-c8f9bca6a2cd`), Thai Presales Engineer (`c12f7855-0f2c-4b1a-82c1-e4e517288364`), QA Lead (`5c60af4b-fe06-40e1-8c5b-b19c16eac787`)

### Objective
Inject the **Jev** System One model by TypeSafe into any enterprise task to achieve:
1. **Best Result**: Semantic precision, deterministic types, elimination of prompt-and-parse fragility.
2. **Best Confidence**: Calibrated uncertainty handling, distribution concentration checks, threshold-based escalation gates.
3. **Best Time Management**: Sub-second (<100ms) execution vs 10s LLM text generation, parallel fan-out across independent questions.

### Execution Steps
1. **Task Profiling & Bottleneck Analysis**:
   - SystemOne Engineer audits the target pipeline (e.g. TOR clause validation, API request routing, PR risk scoring, or test log triage).
2. **Design Primitives**:
   - `Choice`: Discrete option routing, parameter extraction from candidate pools.
   - `Noul`: Instant binary verification (e.g., Thai DGA compliance passes, security policy breach).
   - `Score`: Nuanced multi-level grading (e.g., code maintainability, RFP win probability).
3. **Calibrate Confidence Thresholds**:
   - High Confidence (`>= 0.85`): Instant code execution without human intervention.
   - Low Confidence (`< 0.85`): Automated cascade to System Two (AI Systems Engineer) or human board escalation.
4. **Deploy Code Contract**:
   - Delivers TypeScript / Python integration code using `@typesafe-ai` SDK or HTTP endpoints.

---

## 2. Thai Government & Enterprise Tender (TOR) Workflow

### Key Agents
- **Lead Assignee**: Thai Presales Engineer (`c12f7855-0f2c-4b1a-82c1-e4e517288364`)
- **Workflow Acceleration**: SystemOne Engineer (`436b6774-90b8-44fb-b51b-4d1018acee29`)
- **Technical Review**: CTO (`609564fa-dcc5-4109-aa38-4b6d93eb2c1c`)
- **Costing & Bid Security**: CFO (`a700d817-ed15-4752-8a6b-5d9b962d52d1`)

### Execution Steps
1. **Create Parent Issue**:
   - Title: `TOR Analysis & Bid Proposal: [Project Name]`
   - Assignee: Thai Presales Engineer
   - Prompt requirements:
     - Compliance check with Thai e-GP guidelines, DGA standards, and GDCC hosting requirements.
     - Pair with SystemOne Engineer to run high-speed clause-by-clause Noul checks.
     - Compliance matrix (Pass / Clarify / Deviate).
     - Bill of Quantities (BOQ) draft and project milestone breakdown.
2. **Trigger Heartbeat**:
   - `paperclipai agent heartbeat:invoke c12f7855-0f2c-4b1a-82c1-e4e517288364`
3. **Child Tasks (if required)**:
   - Architecture validation -> CTO
   - Cost estimation & pricing model -> CFO

---

## 3. Full-Stack Software Feature Sprint

### Key Agents
- **Product Strategy**: VP of Product (`30b68b4e-a87d-4c1c-ac86-a457803b272e`)
- **Engineering Lead**: Principal Engineer (`0c619c25-94ca-46a9-a91f-cb951560f657`)
- **System One Architecture**: SystemOne Engineer (`436b6774-90b8-44fb-b51b-4d1018acee29`)
- **UI/UX**: Product Designer (`b647e250-e2cc-4721-b8bd-d6d21faef3bb`)
- **Frontend**: Frontend Engineer (`37b42df4-95fa-442b-be92-43ce2d4f1720`)
- **Backend**: Backend Engineer (`fd1fefcc-9552-4a97-8e9d-c8f9bca6a2cd`)
- **Quality Assurance**: Automation Test Engineer (`5bcb7ebb-6604-4db9-b1e5-c9be5c90ccfd`)

### Execution Steps
1. **Product Spec / User Story**:
   - Assign feature overview to VP of Product or Product Designer to produce specifications and wireframes.
2. **Technical Implementation Breakdown**:
   - Principal Engineer reviews spec, creates API contracts.
   - SystemOne Engineer defines typed Jev judgments for any natural language input or dynamic routing in the feature.
   - Sub-tasks dispatched to Frontend & Backend Engineers.
3. **Automated Testing & Sign-off**:
   - Automation Test Engineer runs test suites, verifies edge cases, and marks QA approval.

---

## 4. Infrastructure, Reliability & DevOps Deployment

### Key Agents
- **DevOps Lead**: DevOps Lead (`f8d23a98-6260-413d-a8f9-2bbe50469def`)
- **Database & Schemas**: Database Administrator (`217c3041-8e8c-4010-8a1e-8c5d21b15cc2`)
- **Resilience & SLA**: Site Reliability Engineer (`f3985b39-28f5-4bb1-9884-871b07626fe7`)

### Execution Steps
1. Create task for DevOps Lead outlining infrastructure specs (Docker, Kubernetes, Cloud Run, Terraform).
2. If schema changes exist, link DBA child task for migration scripts and index validation.
3. SRE verifies monitoring, health probes, and rollback strategy.

---

## 5. Security & Compliance Review

### Key Agents
- **Lead**: Head of Security (`c0a14a7c-5153-4942-81fd-f07f3f3ffae4`)
- **SecOps**: Security Operations Analyst (`f9f4f75a-6030-45c0-afe5-cceb14271f8a`)
- **Automated Gating**: SystemOne Engineer (`436b6774-90b8-44fb-b51b-4d1018acee29`)

### Execution Steps
1. Create issue for Head of Security to review threat models, authentication flows, and data protection (PDPA / GDPR).
2. Security Operations Analyst runs vulnerability audits and code scanning checks.
3. SystemOne Engineer sets up real-time Noul policy compliance gates in CI/CD.

---

## 6. C-Suite Strategic Delegation (CEO Board Order)

### Key Agent
- **CEO**: (`28852e11-2b59-403c-aad1-94623d09748a`)

When the user gives a high-level strategic directive (e.g. "Optimize our operational efficiency across all client deliverables"):
1. Assign top-level strategic initiative to the CEO.
2. CEO will analyze the objective, formulate strategic initiatives, and dispatch child issues to:
   - CTO & SystemOne Engineer for workflow latency & confidence optimization
   - VP of Product for feature roadmap
   - CMO & Thai Presales Engineer for go-to-market and tender alignment
   - CFO for budget modeling
