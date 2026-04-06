# Active schema updated to v2

This pass applies the durable schema additions directly into `prisma/schema.prisma` so the promoted live app path matches the active Prisma schema.

## What changed
- `NotificationKind` enum added
- `Notification` model added
- `TerritoryControl` model added
- `Player.notifications` relation added
- `Territory.controls` relation added

## Why this matters
The promoted runtime now uses durable territory and inbox helpers. Keeping the active schema on the old version would leave the main app path out of sync with the models it expects.

## Next commands
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run start:api`
- `npm run start:worker`
- `npm run start:web`
