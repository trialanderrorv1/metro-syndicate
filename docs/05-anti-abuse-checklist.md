# Anti-Abuse Checklist

## Must-have
- per-IP rate limit on auth endpoints
- per-account rate limit on high-value actions:
  - login
  - crimes
  - fights
  - revive
  - premium purchase calls
  - forum thread create
- server-side validation for all costs and rewards
- never trust client-supplied stats or balances
- idempotency for payment webhook handling
- audit logging for:
  - login failure
  - password change
  - premium grant/revoke
  - admin reset
  - wipe/reset scripts

## Easy exploit checks
- double-submit purchase button
- double-submit crime/fight button
- refresh during timed state transitions
- negative cash/energy/bravery values
- revive action on non-hospitalized player
- jail and hospital overlap state
- equip item not owned
