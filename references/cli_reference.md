# Paperclip AI CLI & API Reference

This document provides a reference for controlling Paperclip AI via CLI commands and REST endpoints.

## 1. Environment & Global Context

The Paperclip CLI reads default context from `~/.paperclip/context.json`.
In this environment:
- **API Base**: `http://127.0.0.1:3100`
- **Company ID**: `ba9c8f2b-7942-4917-aae5-8320e3a9a7c7` (`HJ-Company-Limited`)
- **Persona**: `board` (Antigravity acts as Board / Orchestrator)

### Health Check
```bash
paperclipai health
```
Returns JSON with status `ok` if the local Paperclip server is active.

### View Active Company
```bash
paperclipai company current
```

---

## 2. Agent Management & Wakeup

### List All Agents
```bash
paperclipai agent list -C ba9c8f2b-7942-4917-aae5-8320e3a9a7c7
```
Add `--json` for machine-parseable output.

### Get Agent Details
```bash
paperclipai agent get <agentId>
```

### Trigger Immediate Heartbeat (Execution)
```bash
paperclipai agent heartbeat:invoke <agentId>
```
Invokes the agent loop immediately.

### Wake Up Agent with Context Reason
```bash
paperclipai agent wake <agentId> --reason "Assigned high-priority TOR review" --source on_demand --trigger manual
```

---

## 3. Issue & Task Management

### Create an Issue / Task
```bash
paperclipai issue create -C ba9c8f2b-7942-4917-aae5-8320e3a9a7c7 \
  --title "Draft Architecture Specification for Project X" \
  --description "Detailed prompt and requirements for the agent..." \
  --assignee-agent-id <agentId> \
  --priority high \
  --status todo \
  --json
```

### Create a Child / Sub-task
```bash
paperclipai issue create -C ba9c8f2b-7942-4917-aae5-8320e3a9a7c7 \
  --title "Subtask: Review Security Requirements" \
  --description "Details..." \
  --parent-id <parentIssueId> \
  --assignee-agent-id <securityAgentId> \
  --priority high \
  --status todo
```

### List Issues
```bash
paperclipai issue list -C ba9c8f2b-7942-4917-aae5-8320e3a9a7c7
```
Filter by status or assignee:
```bash
paperclipai issue list -C ba9c8f2b-7942-4917-aae5-8320e3a9a7c7 --status "in_progress,todo" --assignee-agent-id <agentId>
```

### Inspect an Issue
```bash
paperclipai issue get <issueIdOrIdentifier>
```

### Comment on an Issue & Wake Assignee
```bash
paperclipai issue comment <issueId> --body "Board guidance: prioritize DGA compliance" --resume
```
`--resume` wakes the assignee agent automatically to process the comment.

### Handle Interactions / Questions from Agents
When an agent stops to ask the board a question:
```bash
# 1. View interactions
paperclipai issue interactions <issueId>

# 2. Respond to the question
paperclipai issue interaction:respond <issueId> <interactionId> --body "Proceed with PostgreSQL and Redis."
```

### Inspect Work Products
```bash
paperclipai issue work-products <issueId>
```

---

## 4. Run Monitoring & Logs

### View Live / Queued Runs
```bash
paperclipai run live -C ba9c8f2b-7942-4917-aae5-8320e3a9a7c7
```

### Read Agent Heartbeat Log
```bash
paperclipai run log <runId> --text
```

### List Recent Runs
```bash
paperclipai run list -C ba9c8f2b-7942-4917-aae5-8320e3a9a7c7 --limit 10
```

### Cancel a Stuck Run
```bash
paperclipai run cancel <runId>
```

---

## 5. Direct REST API (Localhost:3100)

If CLI output needs custom scripting, endpoints are available:
- `GET http://127.0.0.1:3100/api/health`
- `GET http://127.0.0.1:3100/api/companies/:companyId/agents`
- `GET http://127.0.0.1:3100/api/companies/:companyId/issues`
- `POST http://127.0.0.1:3100/api/companies/:companyId/issues`
- `POST http://127.0.0.1:3100/api/agents/:agentId/wakeup`
- `GET http://127.0.0.1:3100/api/companies/:companyId/runs/live`
