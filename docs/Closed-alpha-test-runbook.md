# Closed alpha test runbook

## Before test starts
- stop adding new gameplay systems
- only allow bug fixes, balancing, and deploy fixes
- log every change during the test window

## Environment checks
- API boots
- web boots
- worker boots
- Postgres reachable
- Redis reachable
- secrets set
- admin routes protected
- backup process works

## Smoke test order
1. auth
2. core actions
3. timers and forced states
4. crews
5. shared crew systems
6. market
7. territory
8. contracts
9. PvP
10. inbox/notifications
11. admin routes
12. mobile pass

## Go/no-go
Go only if:
- smoke tests pass
- worker is running
- database backup is verified
- normalized read/write path is verified
- no blocker bugs remain

Hold the test if:
- state can desync
- player money can duplicate
- refresh auth is unstable
- queue jobs are failing repeatedly

## Daily cadence
Before testers log in:
- check worker health
- check queue depth
- check API logs
- check failed jobs

End of day:
- summarize blockers
- summarize balancing notes
- summarize onboarding friction
