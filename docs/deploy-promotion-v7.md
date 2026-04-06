# Deploy and promotion foundation

This PR promotes the newer live layer into the default current entrypoints and adds deployment-friendly startup scripts.

## Promotion
- `server/app.ts` now points to the live API layer
- `client/App.tsx` now points to the live client layer

## Deployment polish
- clearer startup scripts for web, API, and worker
- explicit start scripts for hosted environments
- Prisma deploy script retained for migration runs

## Recommended deploy flow
1. apply the schema migration for `prisma/schema-v2.prisma`
2. run `npm run prisma:migrate`
3. start API with `npm run start:api`
4. start worker with `npm run start:worker`
5. start web with `npm run start:web`

## Important note
This PR promotes the current live code path, but it does not remove the older parallel files yet. Those can be cleaned up in a later repo tidy-up PR once deployment is confirmed.
