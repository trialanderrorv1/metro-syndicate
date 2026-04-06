# Idiot’s guide to getting Metro Syndicate online

## Use this stack
- GitHub for code
- Railway for hosting
- Postgres for database
- Redis for queues/workers

## You need 3 running services
- web app
- API service
- worker service

## And 2 managed services
- Postgres
- Redis

## Fastest route
1. Push code to GitHub
2. Create Railway project from repo
3. Add Postgres
4. Add Redis
5. Create API service
6. Create worker service
7. Create web service
8. Add environment variables
9. Run `prisma migrate deploy`
10. Generate public web/API domains
11. Set `CLIENT_ORIGIN`
12. Redeploy
13. Confirm worker jobs are alive
14. Run smoke tests
15. Invite a few testers

## Minimum env vars
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `EVENT_SECRET`
- `CLIENT_ORIGIN`
- `NODE_ENV=production`

## Rules
- do not commit real secrets
- do not rely on local disk for game data
- do not skip the worker
- do not open public signups first

## Before inviting testers
- verify auth works
- verify gameplay persists
- verify market works
- verify crews work
- verify contracts work
- verify queue jobs run
- verify backups exist
