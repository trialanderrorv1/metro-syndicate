param(
  [Parameter(Mandatory = $true)][string]$BackupFile,
  [string]$DbName = "metro_syndicate_restore",
  [string]$DbUser = "metro",
  [string]$DbHost = "localhost"
)

Write-Host "Restoring $BackupFile into $DbName"
createdb -h $DbHost -U $DbUser $DbName
pg_restore -h $DbHost -U $DbUser -d $DbName $BackupFile

if ($LASTEXITCODE -ne 0) {
  throw "Restore failed."
}

Write-Host "Restore complete."
