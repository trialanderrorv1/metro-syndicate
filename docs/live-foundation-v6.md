# Live foundation v6

This layer is the first schema-focused consolidation pass.

## Added files
- `prisma/schema-v2.prisma`
- `server/worldLive.ts`
- `server/app-live.ts`
- `client/App-live.tsx`
- `docs/live-foundation-v6.md`

## What it adds
- durable territory control schema
- notification / inbox schema
- server helpers that use durable tables when migrated
- a live foundation API exposing inbox and territory operations
- a consolidated live client screen for territories and notifications

## Migration-safe behavior
The server layer checks whether the new Prisma models are available.
- if notification tables exist, inbox reads and writes are persistent
- if territory control tables exist, territory ownership is durable
- if they do not exist yet, the code fails clearly for those specific operations instead of silently corrupting state

## Promotion guidance
This PR does not force-replace the older parallel `App-*` and `app-*` files.
The intended next cleanup step is to promote:
- `server/app-live.ts` -> current main API entrypoint
- `client/App-live.tsx` -> current main client entrypoint
after the schema migration is applied and verified.
