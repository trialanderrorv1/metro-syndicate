# Economy + world foundation

This layer adds the next persistent loop on top of the crew and persistence base.

## Added files
- `server/economyWorld.ts`
- `server/app-world.ts`
- `client/App-world.tsx`
- `docs/economy-world-foundation.md`

## What it does
- persists market listings through Prisma
- seeds and lists contracts through Prisma
- supports contract claiming and reward payout
- seeds territories through Prisma
- supports territory attacks and immediate crew cash payout
- adds a combined world client for actions, market, contracts, and territory interaction

## Important note
Market and contracts are persistent with the current schema.
Territory control in this layer uses a demo in-process ownership map so the repo gets a working loop now without forcing a larger schema migration in the same PR.

## Suggested next step
The next schema-focused PR should add durable territory control storage and then merge this world layer into the main current app entrypoints.
