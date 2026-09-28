<#
.SYNOPSIS
    Paperclip AI Orchestration Helper Script with System 1 Decision Fabric (Jev by TypeSafe)
.DESCRIPTION
    Provides automated commands for Antigravity to dispatch, monitor, and query Paperclip AI,
    with embedded TypeSafe Jev Gateways (A-E), Transparent Reverse Proxy, and Multi-Agent Workflow Cascade.
#>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("status", "roster", "dispatch", "wake", "live", "log", "issues", "comments", "gate-triage", "gate-security", "gate-compliance", "gate-quality", "cascade-start", "cascade-status", "cascade-stop", "cascade-trigger", "proxy-start", "proxy-status", "proxy-stop", "proxy-audit")]
    [string]$Action,

    [string]$AgentName,
    [string]$Title,
    [string]$Description,
    [string]$Priority = "high",
    [string]$IssueId,
    [string]$RunId,
    [string]$Command,
    [string]$TorClause,
    [string]$Proposal,
    [string]$TestResults,
    [string]$DiffSummary,
    [string]$CompanyId = "ba9c8f2b-7942-4917-aae5-8320e3a9a7c7",
    [string]$ApiBase = "http://127.0.0.1:3105"
)

$ErrorActionPreference = "Stop"
$InterceptorDir = Join-Path $PSScriptRoot "..\services\gateway-interceptor"
$InterceptorCli = Join-Path $InterceptorDir "src\cli.js"
$InterceptorServer = Join-Path $InterceptorDir "src\server.js"
$CascadeDaemon = Join-Path $InterceptorDir "src\cascade-daemon.js"
$CascadePidFile = Join-Path $InterceptorDir "cascade-daemon.pid"
$CascadeLogFile = Join-Path $InterceptorDir "cascade-daemon.log"
$ProxyPidFile = Join-Path $InterceptorDir "proxy-server.pid"
$ProxyLogFile = Join-Path $InterceptorDir "proxy-server.log"
$ProxyErrFile = Join-Path $InterceptorDir "proxy-server.err.log"

function Get-AgentMap {
    $rosterPath = Join-Path $PSScriptRoot "..\references\org_roster.json"
    if (Test-Path $rosterPath) {
        $json = Get-Content $rosterPath -Raw | ConvertFrom-Json
        return $json
    }
    $raw = paperclipai agent list -C $CompanyId --json | ConvertFrom-Json
    return $raw
}

function Resolve-AgentId([string]$query) {
    if ([guid]::TryParse($query, [ref][guid]::Empty)) {
        return $query
    }
    $cleanQuery = $query.ToLower().Replace('_', '').Replace('-', '').Replace(' ', '')
    $agents = Get-AgentMap
    $match = $agents | Where-Object {
        $cName = if ($_.name) { $_.name.ToLower().Replace('_', '').Replace('-', '').Replace(' ', '') } else { '' }
        $cUrl = if ($_.urlKey) { $_.urlKey.ToLower().Replace('_', '').Replace('-', '').Replace(' ', '') } else { '' }
        $cRole = if ($_.role) { $_.role.ToLower().Replace('_', '').Replace('-', '').Replace(' ', '') } else { '' }
        $cName.Contains($cleanQuery) -or $cUrl.Contains($cleanQuery) -or $cRole.Contains($cleanQuery) -or $cleanQuery.Contains($cName) -or $cleanQuery.Contains($cUrl)
    } | Select-Object -First 1

    if ($match) {
        return $match.id
    }
    throw "Agent matching '$query' not found."
}

switch ($Action) {
    "status" {
        Write-Host "=== Paperclip Server Health ===" -ForegroundColor Cyan
        paperclipai health
        Write-Host "`n=== Company Details ===" -ForegroundColor Cyan
        paperclipai company current

        # Check Proxy Health
        try {
            $proxyRes = Invoke-RestMethod -Uri "http://127.0.0.1:3105/health" -Method Get -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($proxyRes) {
                Write-Host "`n=== ⚡ Jev Reverse Proxy Status (Port 3105) ===" -ForegroundColor Green
                Write-Host "Status: $($proxyRes.status) | Mode: $($proxyRes.mode) | Zero-Cache: $($proxyRes.zeroCacheMode) | Audits: $($proxyRes.auditCount)"
                Write-Host "Target Paperclip Reachable: $($proxyRes.targetHealth.reachable)"
            }
        } catch {
            Write-Host "`n=== ⚡ Jev Reverse Proxy (Port 3105) ===" -ForegroundColor Gray
            Write-Host "Proxy is not currently running. Start it with: orchestrate.ps1 -Action proxy-start"
        }
    }

    "roster" {
        Write-Host "=== Active Agents in Company $CompanyId ===" -ForegroundColor Green
        $agents = Get-AgentMap
        $agents | Select-Object name, role, title, id | Format-Table -AutoSize
    }

    "proxy-start" {
        Write-Host "Starting TypeSafe Jev Synchronous Reverse Proxy on port 3105..." -ForegroundColor Yellow
        $proc = Start-Process node -ArgumentList $InterceptorServer -PassThru -WindowStyle Hidden -RedirectStandardOutput $ProxyLogFile -RedirectStandardError $ProxyErrFile
        Set-Content -Path $ProxyPidFile -Value $proc.Id -Encoding utf8
        Start-Sleep -Milliseconds 800
        Write-Host "Jev Reverse Proxy started successfully! PID: $($proc.Id) (Port: 3105 -> Target: 3100)" -ForegroundColor Green
    }

    "proxy-status" {
        if (Test-Path $ProxyPidFile) {
            $pidVal = Get-Content $ProxyPidFile -Raw
            $proc = Get-Process -Id ([int]$pidVal.Trim()) -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "Jev Reverse Proxy is RUNNING (PID: $($proc.Id)) on port 3105" -ForegroundColor Green
            } else {
                Write-Host "Proxy PID file exists ($pidVal) but process is NOT running." -ForegroundColor Red
            }
        } else {
            Write-Host "Jev Reverse Proxy is STOPPED." -ForegroundColor Gray
        }

        try {
            $health = Invoke-RestMethod -Uri "http://127.0.0.1:3105/health" -Method Get -TimeoutSec 2
            Write-Host "`n=== Live Proxy Health ===" -ForegroundColor Cyan
            $health | ConvertTo-Json -Depth 3 | Write-Host
        } catch {}
    }

    "proxy-stop" {
        if (Test-Path $ProxyPidFile) {
            $pidVal = Get-Content $ProxyPidFile -Raw
            try {
                Stop-Process -Id ([int]$pidVal.Trim()) -Force -ErrorAction SilentlyContinue
                Write-Host "Jev Reverse Proxy stopped (PID: $pidVal)" -ForegroundColor Yellow
            } catch {}
            Remove-Item $ProxyPidFile -Force -ErrorAction SilentlyContinue
        } else {
            Write-Host "Jev Reverse Proxy is not running." -ForegroundColor Gray
        }
    }

    "proxy-audit" {
        try {
            $res = Invoke-RestMethod -Uri "http://127.0.0.1:3105/proxy/audit?limit=20" -Method Get
            Write-Host "=== ⚡ Jev Reverse Proxy Audit Ring Buffer (Total: $($res.count)) ===" -ForegroundColor Cyan
            if ($res.audits -and $res.audits.Count -gt 0) {
                $res.audits | Select-Object timestamp, method, path, gateway, verdict, action, status, latencyMs | Format-Table -AutoSize
            } else {
                Write-Host "No requests intercepted yet." -ForegroundColor Gray
            }
        } catch {
            Write-Host "Could not query /proxy/audit. Ensure Proxy is running on port 3105." -ForegroundColor Red
        }
    }

    "gate-triage" {
        if (-not $Title) { throw "gate-triage requires -Title" }
        Write-Host "=== ⚡ System 1 Reflex Gate (Gateway A & B Triage) ===" -ForegroundColor Yellow
        if ($Description) {
            node $InterceptorCli triage --title $Title --desc $Description
        } else {
            node $InterceptorCli triage --title $Title
        }
    }

    "gate-security" {
        if (-not $Command) { throw "gate-security requires -Command" }
        Write-Host "=== ⚡ System 1 Reflex Gate (Gateway C Security & Tool Safety) ===" -ForegroundColor Yellow
        node $InterceptorCli security --cmd $Command --role $AgentName
    }

    "gate-compliance" {
        if (-not $TorClause -or -not $Proposal) { throw "gate-compliance requires -TorClause and -Proposal" }
        Write-Host "=== ⚡ System 1 Reflex Gate (Gateway D TOR & Compliance) ===" -ForegroundColor Yellow
        node $InterceptorCli compliance --clause $TorClause --proposal $Proposal
    }

    "gate-quality" {
        Write-Host "=== ⚡ System 1 Reflex Gate (Gateway E Code Quality & PR Evaluator) ===" -ForegroundColor Yellow
        node $InterceptorCli quality --issue $IssueId --tests $TestResults --diff $DiffSummary
    }

    "cascade-start" {
        Write-Host "Starting Cascade Daemon in background..." -ForegroundColor Yellow
        $proc = Start-Process node -ArgumentList $CascadeDaemon -PassThru -WindowStyle Hidden
        Set-Content -Path $CascadePidFile -Value $proc.Id -Encoding utf8
        Write-Host "Cascade Daemon started! PID: $($proc.Id)" -ForegroundColor Green
    }

    "cascade-status" {
        if (Test-Path $CascadePidFile) {
            $pidVal = Get-Content $CascadePidFile -Raw
            $proc = Get-Process -Id ([int]$pidVal.Trim()) -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "Cascade Daemon is RUNNING (PID: $($proc.Id))" -ForegroundColor Green
            } else {
                Write-Host "Cascade Daemon PID file exists ($pidVal) but process is NOT running." -ForegroundColor Red
            }
        } else {
            Write-Host "Cascade Daemon is STOPPED." -ForegroundColor Gray
        }

        if (Test-Path $CascadeLogFile) {
            Write-Host "`n=== Recent Cascade Daemon Logs ===" -ForegroundColor Cyan
            Get-Content $CascadeLogFile -Tail 15
        }
    }

    "cascade-stop" {
        if (Test-Path $CascadePidFile) {
            $pidVal = Get-Content $CascadePidFile -Raw
            try {
                Stop-Process -Id ([int]$pidVal.Trim()) -Force -ErrorAction SilentlyContinue
                Write-Host "Cascade Daemon stopped (PID: $pidVal)" -ForegroundColor Yellow
            } catch {}
            Remove-Item $CascadePidFile -Force -ErrorAction SilentlyContinue
        } else {
            Write-Host "Cascade Daemon is not running." -ForegroundColor Gray
        }
    }

    "cascade-trigger" {
        if (-not $IssueId) { throw "cascade-trigger requires -IssueId" }
        Write-Host "Triggering Cascade evaluation for Issue $IssueId..." -ForegroundColor Yellow
        $engineUrl = "file:///" + (Join-Path $InterceptorDir "src\cascade-engine.js").Replace('\', '/')
        node -e "
import('$engineUrl').then(async ({ CascadeEngine }) => {
  const engine = new CascadeEngine({ apiBase: '$ApiBase', companyId: '$CompanyId' });
  const res = await fetch('$ApiBase/api/issues/$IssueId');
  if (!res.ok) { console.error('Could not fetch issue'); process.exit(1); }
  const issue = await res.json();
  const docsRes = await fetch('$ApiBase/api/issues/$IssueId/documents');
  let content = issue.description;
  if (docsRes.ok) {
    const docs = await docsRes.json();
    if (docs.length > 0) content = docs.map(d => d.body || '').join('\n\n');
  }
  const result = await engine.processIssueTransition(issue, { content });
  console.log(JSON.stringify(result, null, 2));
});
"
    }

    "dispatch" {
        if (-not $Title) {
            throw "Dispatch requires -Title"
        }

        # Step 1: Pre-flight Gateway A & B Triage
        Write-Host "=== ⚡ Pre-flight System 1 Triage (Gateway A & B) ===" -ForegroundColor Yellow
        $triageOutput = if ($Description) {
            node $InterceptorCli triage --title $Title --desc $Description
        } else {
            node $InterceptorCli triage --title $Title
        }
        $triageJson = $triageOutput | ConvertFrom-Json
        Write-Host "Jev Reflex: Latency $($triageJson.totalLatencyMs)ms | Assignee: $($triageJson.route.selectedAssignee) (Conf: $($triageJson.route.assigneeConfidence)) | Action: $($triageJson.decision.action)" -ForegroundColor Green

        # Auto-resolve agent if not explicitly passed
        if (-not $AgentName) {
            $AgentName = $triageJson.route.selectedAssignee
        }

        $targetAgentId = Resolve-AgentId $AgentName
        Write-Host "Creating task for Agent: $AgentName ($targetAgentId)..." -ForegroundColor Yellow
        $created = paperclipai issue create -C $CompanyId --title $Title --description $Description --assignee-agent-id $targetAgentId --priority $Priority --status "todo" --json | ConvertFrom-Json
        Write-Host "Issue created: $($created.identifier) ($($created.id))" -ForegroundColor Green

        Write-Host "Invoking heartbeat on agent $targetAgentId..." -ForegroundColor Cyan
        paperclipai agent heartbeat:invoke $targetAgentId --json
        Write-Host "Dispatched successfully!" -ForegroundColor Green
    }

    "wake" {
        if (-not $AgentName) { throw "Wake requires -AgentName" }
        $targetAgentId = Resolve-AgentId $AgentName
        Write-Host "Waking up Agent $AgentName ($targetAgentId)..." -ForegroundColor Yellow
        paperclipai agent heartbeat:invoke $targetAgentId
    }

    "live" {
        Write-Host "=== Live / Queued Runs ===" -ForegroundColor Cyan
        paperclipai run live -C $CompanyId
    }

    "log" {
        if (-not $RunId) {
            $runs = paperclipai run list -C $CompanyId --limit 1 --json | ConvertFrom-Json
            if ($runs.Count -gt 0) {
                $RunId = $runs[0].id
            } else {
                throw "No runs found and no -RunId specified."
            }
        }
        Write-Host "=== Log for Run $RunId ===" -ForegroundColor Cyan
        paperclipai run log $RunId --text
    }

    "issues" {
        Write-Host "=== Issues in Company $CompanyId ===" -ForegroundColor Cyan
        paperclipai issue list -C $CompanyId
    }

    "comments" {
        if (-not $IssueId) { throw "Comments requires -IssueId" }
        paperclipai issue comments $IssueId
    }
}
