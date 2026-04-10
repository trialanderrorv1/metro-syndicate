# Metro Syndicate live testing runbook

## Goal
Run a controlled live test with enough structure to catch gameplay, auth, persistence, premium, and timing issues before a wider rollout.

## Before each test round
1. Confirm the correct branch/build is deployed locally.
2. Back up the database.
3. Confirm migrations are applied.
4. Start the API and web app.
5. Open a browser console and keep the API log window visible.
6. Confirm login, logout, and refresh work before deeper testing.

## Recommended test accounts
Use at least three accounts:
- Fresh user
- Mid-progress user
- Premium user

## Core live-test path
### Auth
- Register new account
- Login with email
- Login with handle
- Refresh while logged in
- Logout
- Incorrect password error
- Session remains account-specific

### Game shell
- Lands on Home after login
- Background art loads correctly
- Right rail and notices align properly
- Buttons remain readable and consistent

### Crimes
- Attempt available crime
- Not enough bravery state shows correctly
- Crime success chance matches current crime
- KO from crime sends player to hospital
- Hospital timer scales by crime progression
- Jail outcome applies correctly

### Fighting
- Fight consumes the correct energy amount
- Not enough energy state shows correctly
- Fight win/loss notice appears correctly

### Hospital / jail restrictions
- Hospitalized player cannot revive themselves
- Hospitalized player only sees allowed tabs
- Jailed player cannot bail or bust themselves out
- Jailed player only sees allowed tabs

### Market / inventory
- Buy affordable item
- Not enough money state shows correctly
- Affordable-only shop toggle works
- Recovery item usage works
- Hospital inventory restriction works

### Travel
- Travel works once
- Travel cooldown blocks immediate re-travel
- Cooldown UI is clear

### Premium
- Premium activation works
- Premium remaining time displays in days
- Cancel continuous premium works
- Premium UI reflects state after refresh

### Persistence
- Refresh preserves state
- Logout/login preserves state
- Second account does not inherit first account state

## During testing
For every issue, log:
- account used
- page/tab
- exact action taken
- expected result
- actual result
- screenshot if possible
- whether it reproduces after refresh

## After each round
1. Triage bugs into blocker, major, minor, polish.
2. Fix blockers first.
3. Re-run affected areas plus auth/login smoke tests.
4. Back up the database again before the next full round.
