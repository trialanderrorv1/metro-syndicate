param(
  [string]$DbName = "metro_syndicate",
  [string]$DbUser = "metro",
  [string]$DbHost = "localhost",
  [string]$BackupDir = ".\backups"
)

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
$target = Join-Path $BackupDir "$DbName-$timestamp.dump"

Write-Host "Creating backup: $target"
pg_dump -Fc -h $DbHost -U $DbUser $DbName -f $target

if ($LASTEXITCODE -ne 0) {
  throw "pg_dump failed."
}

Write-Host "Backup complete."
