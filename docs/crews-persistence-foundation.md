# Crews + persistence foundation

This layer adds persistent demo players and the first social backend foundation.

## Added files
- `server/persistence.ts`
- `server/app-crews.ts`
- `client/App-crews.tsx`
- `docs/crews-persistence-foundation.md`

## What it does
- creates and loads persistent demo players by handle
- stores player state in Postgres through Prisma
- supports server-side gameplay actions per handle
- allows founding a crew
- allows inviting another handle into a crew
- allows accepting or declining invites
- persists crew chat messages using the current available schema

## Important note
This uses the existing schema and intentionally avoids a risky larger schema rewrite in the same PR. It is a practical next foundation step, not the final full crew architecture.

## Suggested next step
After review, promote `server/app-crews.ts` and `client/App-crews.tsx` as the current main entrypoints or merge their behavior into the current app files.
