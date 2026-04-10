# Frozen Build Checklist

## Goal
Create one known-good alpha build where all files are in sync and no gameplay changes are made during the test window.

## Freeze steps
1. Pick one branch or local folder as the alpha source of truth.
2. Remove all old patch folders and stale copied files.
3. Verify the following files are the exact intended versions:
   - `client/App.tsx`
   - `shared/gameData.ts`
   - `server/gameplayEngine.ts`
   - `server/persistence.ts`
   - `server/app.ts`
4. Delete Vite cache:
   - `node_modules/.vite`
5. Run a clean install:
   - `npm install`
6. Run local smoke checks:
   - API starts
   - worker starts
   - web starts
   - create a fresh player
   - crimes work
   - fights work
   - hospital/jail work
   - shops render
   - premium page renders
7. Tag that exact build as:
   - `alpha-0.1.0`
8. Do not change gameplay balance during the first external test wave.
9. Log every bug against that fixed build.
10. Roll fixes into `alpha-0.1.1`, not directly into the frozen build.

## Smoke test matrix
- new account
- returning account
- premium active
- premium expired
- jailed player
- hospitalized player
- empty inventory
- equipped inventory
- forum thread create
