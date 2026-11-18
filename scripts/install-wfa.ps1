[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$WfaCheckout,
    [switch]$Apply
)
$ErrorActionPreference = 'Stop'
$project = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$source = (Resolve-Path -LiteralPath $WfaCheckout).Path
$policy = Get-Content -LiteralPath (Join-Path $project 'integrations/toolchain.json') -Raw | ConvertFrom-Json
$head = (& git -C $source rev-parse HEAD 2>&1 | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $head -ne $policy.wfa.sourceSha) {
    throw "WFA checkout HEAD mismatch. Expected $($policy.wfa.sourceSha); got $head"
}
$origin = (& git -C $source remote get-url origin 2>&1 | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $origin -notmatch '^(https://github\.com/|git@github\.com:)m-amirov/workflow-for-agents(\.git)?$') {
    throw "Untrusted WFA checkout origin: $origin"
}
$installer = Join-Path $source 'scripts/install.ps1'
if (-not (Test-Path -LiteralPath $installer -PathType Leaf)) {
    throw "WFA installer missing at pinned checkout."
}
$names = [string[]]$policy.wfa.skills
Write-Host "Checking project-scoped WFA installation: $project"
& $installer -Scope project -ProjectPath $project -Skills $names -DryRun
if (-not $?) { throw 'WFA dry-run failed; no files installed.' }
if (-not $Apply) {
    Write-Host 'DRY_RUN_ONLY: pass -Apply to install project Skills after reviewing the plan.'
    return
}
& $installer -Scope project -ProjectPath $project -Skills $names
if (-not $?) { throw 'WFA project installation failed; inspect WFA managed manifest/transaction before retrying.' }
Write-Host 'WFA_PROJECT_INSTALL_REQUESTED: inspect .agents/skills and installer report for actual result.'
