param(
  [string]$AppRoot = '',
  [switch]$SkipInstall,
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

if (-not $AppRoot) {
  $candidates = @(
    (Join-Path $PSScriptRoot '..\..\learnharness'),
    (Join-Path $PSScriptRoot '..\learnharness'),
    'D:\Github\learnharness'
  )
  foreach ($candidate in $candidates) {
    if (Test-Path (Join-Path $candidate 'next.config.ts')) {
      $AppRoot = $candidate
      break
    }
  }
}

if (-not $AppRoot -or -not (Test-Path (Join-Path $AppRoot 'next.config.ts'))) {
  throw 'Cannot find the LearnHarness checkout. Pass -AppRoot <path>.'
}

$AppRoot = (Resolve-Path $AppRoot).Path
Push-Location $AppRoot
try {
  Write-Host "LearnHarness root: $AppRoot"

  if (-not $SkipInstall) {
    if (-not (Test-Path (Join-Path $AppRoot 'node_modules\next'))) {
      $env:npm_config_os = 'win32'
      $env:npm_config_cpu = 'x64'
      $env:ELECTRON_SKIP_BINARY_DOWNLOAD = '1'
      npm ci --no-audit --no-fund
    } else {
      Write-Host 'node_modules already present; skipping npm ci'
    }
  }

  node (Join-Path $PSScriptRoot 'patch-lightningcss.mjs') $AppRoot
  if ($LASTEXITCODE -ne 0) { throw 'lightningcss preparation failed' }

  if (-not $SkipBuild) {
    $env:LH_WEB_SERVER = '1'
    $env:NODE_ENV = 'production'
    $env:NEXT_TELEMETRY_DISABLED = '1'
    node (Join-Path $PSScriptRoot 'clean-next.mjs') $AppRoot
    npm run build
    if ($LASTEXITCODE -ne 0) { throw 'LearnHarness build failed' }
  }

  Write-Host 'LearnHarness is ready for the DSH panel.'
} finally {
  Pop-Location
}
