# Stops the local portable PostgreSQL.
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$bin = Join-Path $root ".dev\pgsql\bin"
$data = Join-Path $root ".dev\pgdata"

& (Join-Path $bin "pg_ctl.exe") stop -D $data -m fast
