# Main UI shell and Prisma 7 alignment

This pass applies the missing glue between the promoted runtime and the actual user experience.

## What changed
- `client/App.tsx` becomes a real multi-tab shell instead of a single placeholder screen
- `server/app.ts` now exposes crew routes alongside world, territory, market, and inbox routes
- `server/persistence.ts` is aligned to Prisma 7 with a Postgres adapter and race-safe demo handle creation
- active `prisma/schema.prisma` is adjusted for Prisma 7 config usage
- `prisma.config.ts`, `vite.config.ts`, `index.html`, and `client/main.tsx` are added so the repo boots cleanly
- `package.json` includes the dependencies and scripts needed for the current setup

## Result
The default app path is no longer just one screen. The main frontend now exposes the systems already built in the repo: actions, crews, market, territories, inbox, and log.
