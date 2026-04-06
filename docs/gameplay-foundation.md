# Gameplay foundation

This layer adds a playable server-driven loop on top of the scaffolded source seed.

## Added files
- `server/gameplayEngine.ts`
- `server/app-gameplay.ts`
- `client/secureApi.ts`
- `client/App-gameplay.tsx`

## What it does
- resolves core actions on the server
- exposes `/api/bootstrap`
- exposes `/api/actions`
- exposes `/api/reset-demo`
- gives the client a simple API helper
- gives the client a basic playable screen for work, travel, training, crimes, rival fights, item buying, and reset

## Important note
This is a gameplay foundation layer, not the final full multiplayer backend. It is meant to move the repo from static source seed to server-driven interaction.

## Suggested next step
Promote `server/app-gameplay.ts` and `client/App-gameplay.tsx` into the main current entrypoints once this PR is reviewed.
