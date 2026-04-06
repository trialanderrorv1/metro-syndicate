# Architecture

## Frontend
React client for gameplay, crews, market, contracts, territory, PvP, inbox, and original 128-bit style visuals.

## Backend
Express API for auth, server-authoritative gameplay, crews, market, contracts, territory, PvP, notifications, and admin routes.

## Worker
BullMQ worker for timers, expiries, payouts, and queued world tasks.

## Database
Postgres via Prisma.

## Cache / queue / locks
Redis for queues, throttles, cooldowns, and locks.

## Realtime
Socket.IO for crew chat, DMs, and live event updates.
