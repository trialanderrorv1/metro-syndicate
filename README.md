# Metro Syndicate

Metro Syndicate is a multiplayer browser crime game foundation with server-authoritative gameplay, crews, PvP, player market, contracts, territory control, persistent backend data, and original 128-bit-era styled visuals.

## Current repo status
This repository has been bootstrapped for GitHub import and deployment prep.

It currently includes:
- repo hygiene files
- deployment docs
- test runbook docs
- import/cleanup guidance
- starter folder structure

Add the actual project source into:
- `client/`
- `server/`
- `shared/`
- `prisma/`
- `tests/`
- `scripts/`

## Recommended structure
- `client/` frontend
- `server/` backend and workers
- `shared/` shared types/data
- `prisma/` database schema
- `docs/` deployment and testing docs
- `tests/` smoke, unit, integration
- `scripts/` local helper scripts

## Environment
Copy `.env.example` to `.env` and fill in real values locally.

Do not commit real secrets.

## Deployment
See `docs/Idiots-guide-get-game-online.md`

## Testing
See `docs/Closed-alpha-test-runbook.md`

## GitHub prep
See `docs/GitHub-import-pack.md`

## Status
Closed-alpha preparation. Not yet public-launch hardened.
