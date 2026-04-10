# Metro Syndicate Release Readiness Checklist

## 1. Remove test-only shortcuts
- [x] DeanTest1 unlimited bravery removed from the client
- [x] DeanTest1 unlimited bravery removed from the server
- [x] In-game Testing tab removed from the main navigation
- [ ] Remove any one-off local reset scripts you do not want to ship
- [ ] Remove any leftover debug/test copy from UI text

## 2. Auth and session regression
- [ ] Register a new account
- [ ] Log in with an existing account
- [ ] Refresh the page and confirm the session persists
- [ ] Log out and confirm the login screen returns
- [ ] Log in as a second account and confirm no state bleed

## 3. Core gameplay regression
- [ ] Crimes
- [ ] Fights
- [ ] Jobs and daily pay
- [ ] Travel and cooldown
- [ ] Hospital restrictions
- [ ] Jail restrictions
- [ ] Inventory and equipment
- [ ] Shops and affordability filter
- [ ] Market purchases
- [ ] Forums
- [ ] Premium monthly / continuous / cancel

## 4. Data persistence
- [ ] Progress remains after page refresh
- [ ] Progress remains after logout/login
- [ ] Separate users keep separate state

## 5. Pre-deploy checks
- [ ] Confirm `DATABASE_URL` and production env vars
- [ ] Back up the database
- [ ] Run Prisma generate and migrate/deploy
- [ ] Boot API and web in production-like config
- [ ] Smoke test `/auth/login`, `/auth/me`, and the post-login shell
