# Schema v2 migration checklist

Use this after the promotion pass so the live path has the tables it expects.

## Files
- current default runtime uses `server/app.ts`
- current default client uses `client/App.tsx`
- new schema foundation lives in `prisma/schema-v2.prisma`

## Recommended migration flow
1. compare `prisma/schema.prisma` and `prisma/schema-v2.prisma`
2. merge the new models into the active schema file you want to deploy
3. run Prisma generate
4. run Prisma migrate deploy
5. boot API with `npm run start:api`
6. boot worker with `npm run start:worker`
7. verify health endpoint
8. verify demo register/bootstrap
9. verify notifications read/write
10. verify territory attack with durable control rows

## New schema pieces to apply
- `NotificationKind`
- `Notification`
- `TerritoryControl`
- `Player.notifications` relation
- `Territory.controls` relation

## Verification checks
- creating a notification inserts a row
- marking a notification read sets `readAt`
- attacking a territory creates or updates a `TerritoryControl` row
- subsequent bootstrap requests show the same owner/defense values

## Rollback note
If migration is not applied yet, the live server code is designed to fail clearly for those specific durable operations instead of silently inventing fake persistent data.
