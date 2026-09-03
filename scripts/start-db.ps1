# Starts the local portable PostgreSQL (no Docker needed).
# First run: scripts\setup-db.ps1 must have been run once to create .dev\pgsql + .dev\pgdata.
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$bin = Join-Path $root ".dev\pgsql\bin"
$data = Join-Path $root ".dev\pgdata"
$log = Join-Path $root ".dev\postgres.log"

if (-not (Test-Path (Join-Path $bin "pg_ctl.exe"))) {
  Write-Error "Portable PostgreSQL not found. Run scripts\setup-db.ps1 first (or use docker compose up -d)."
}

& (Join-Path $bin "pg_ctl.exe") status -D $data 2>$null
if ($LASTEXITCODE -eq 0) {
  Write-Host "PostgreSQL is already running on port 5433."
} else {
  & (Join-Path $bin "pg_ctl.exe") start -D $data -l $log -w
  Write-Host "PostgreSQL started on port 5433 (log: .dev\postgres.log)."
}
