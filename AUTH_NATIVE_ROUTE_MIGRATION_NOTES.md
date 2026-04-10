# Auth-Native Route Migration Notes

The current client authenticates with `/auth/*`, but gameplay still uses the handle-based `/api/demo/*` bridge.

## Current state
- Login/register/session are real
- The browser uses the signed-in handle to bootstrap the game
- Gameplay endpoints are still the older handle-addressed demo routes

## Recommended next server migration
Create authenticated endpoints such as:

- `GET /api/me/bootstrap`
- `POST /api/me/actions`
- `POST /api/me/contracts/:contractId/claim`
- `POST /api/me/market/listings/:listingId/buy`
- `POST /api/me/jail/:id/:mode`
- `POST /api/me/hospital/:id/revive`

Each endpoint should:
1. Resolve the signed-in user from the session
2. Use the authenticated user's handle on the server side
3. Return the same payload shape the client already expects

## Recommended client migration
Replace all `/api/demo/${activeHandle}/...` calls with `/api/me/...`.

This keeps the current UI largely intact while removing the remaining demo bridge.
