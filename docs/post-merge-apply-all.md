# Post-merge apply-all runbook

Use this immediately after merging PR #8.

## 1. Schema work
- compare `prisma/schema.prisma` with `prisma/schema-v2.prisma`
- merge the durable territory and notification models into the active deploy schema
- run Prisma generate
- run Prisma migrate deploy

## 2. Boot the promoted runtime path
- API uses `server/app.ts`
- client uses `client/App.tsx`
- worker uses `server/worker.ts`

Suggested commands:
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run start:api`
- `npm run start:worker`
- `npm run start:web`

## 3. Verify live features
- register/load a demo handle
- check `/health`
- verify market still loads
- verify contracts still load
- verify territory attack now writes durable control rows
- verify notifications can be created and marked read

## 4. What to do next
After this is confirmed, the next good PR is one of these:
- Railway deployment config and environment polish
- final reference-file cleanup for the old gameplay/crews/world variants
- stronger auth/session layer replacing demo-only handle loading
