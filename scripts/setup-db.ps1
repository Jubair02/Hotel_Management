# One-time setup of a portable PostgreSQL for local dev (no Docker, no admin).
# Downloads are handled by the caller — this expects the EDB binaries zip at $ZipPath
# (default: %TEMP%\pgsql-17.5.zip) or an already-extracted .dev\pgsql.
param(
  [string]$ZipPath = "$env:TEMP\pgsql-17.5.zip"
)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$devDir = Join-Path $root ".dev"
$pgsql = Join-Path $devDir "pgsql"
$data = Join-Path $devDir "pgdata"
$bin = Join-Path $pgsql "bin"

New-Item -ItemType Directory -Force $devDir | Out-Null

if (-not (Test-Path (Join-Path $bin "initdb.exe"))) {
  if (-not (Test-Path $ZipPath)) {
    Write-Error "PostgreSQL binaries zip not found at $ZipPath. Download the 'windows-x64-binaries' zip from enterprisedb.com first."
  }
  Write-Host "Extracting PostgreSQL binaries (this takes a few minutes)…"
  Expand-Archive -Path $ZipPath -DestinationPath $devDir -Force
}

if (-not (Test-Path (Join-Path $data "PG_VERSION"))) {
  Write-Host "Initializing database cluster…"
  $pwfile = Join-Path $devDir "pgpass.tmp"
  Set-Content -Path $pwfile -Value "hotel" -Encoding ascii -NoNewline
  & (Join-Path $bin "initdb.exe") -D $data -U hotel --pwfile=$pwfile -E UTF8 -A scram-sha-256 | Out-Null
  Remove-Item $pwfile -Force
  Add-Content -Path (Join-Path $data "postgresql.conf") -Value "`nport = 5433`nlisten_addresses = 'localhost'"
}

& (Join-Path $bin "pg_ctl.exe") status -D $data 2>$null
if ($LASTEXITCODE -ne 0) {
  & (Join-Path $bin "pg_ctl.exe") start -D $data -l (Join-Path $devDir "postgres.log") -w
}

$env:PGPASSWORD = "hotel"
$exists = & (Join-Path $bin "psql.exe") -h localhost -p 5433 -U hotel -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='hotel_management'"
if ($exists -ne "1") {
  & (Join-Path $bin "createdb.exe") -h localhost -p 5433 -U hotel hotel_management
  Write-Host "Created database hotel_management."
}
Write-Host "PostgreSQL ready on localhost:5433 (user: hotel / hotel)."
