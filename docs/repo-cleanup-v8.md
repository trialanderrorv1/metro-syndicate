# Repo cleanup v8

This cleanup pass removes the duplicated promoted entrypoint files and leaves the repo with a clearer default runtime path.

## What was cleaned
- duplicated promoted live entrypoint files removed
- migration checklist added for schema v2 rollout

## Current intended defaults
- API: `server/app.ts`
- Client: `client/App.tsx`
- Worker: `server/worker.ts`

## Later cleanup ideas
- archive or remove older `app-gameplay`, `app-crews`, and `app-world` variants once you are sure they are no longer useful as references
- collapse schema files after the durable migration is fully applied
