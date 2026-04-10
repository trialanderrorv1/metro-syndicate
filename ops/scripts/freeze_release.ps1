param(
  [string]$Tag = "alpha-0.1.0"
)

Write-Host "Freeze checklist:"
Write-Host "1. Verify App.tsx, gameData.ts, gameplayEngine.ts, persistence.ts, app.ts are in sync."
Write-Host "2. Clear node_modules/.vite"
Write-Host "3. Smoke test API, worker, web"
Write-Host "4. Tag build as $Tag"
Write-Host "5. Stop feature changes during test window"
