# Production Database and Backup Runbook

## Minimum setup
- hosted Postgres
- daily full backup
- point-in-time recovery if available
- weekly restore test to a staging database
- encrypted secrets
- access limited to admin IPs or VPN

## Backup schedule
- nightly full backup
- keep 14 daily copies
- keep 8 weekly copies
- keep 3 monthly copies

## Before every deploy
- take manual snapshot
- verify latest backup completed
- verify restore instructions still work

## Restore drill
1. create empty staging database
2. restore most recent backup
3. start API against staging copy
4. verify:
   - players load
   - inventory renders
   - premium fields load
   - timers normalize correctly
