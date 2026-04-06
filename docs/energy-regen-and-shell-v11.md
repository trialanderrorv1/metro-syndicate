# Energy regeneration and Torn-like shell update

## Included
- server-authoritative energy regeneration at 5 energy every 10 minutes
- passive regen calculated from `energyUpdatedAt` in player state
- Torn-inspired shell layout with a left navigation rail, central action/content area, and right status rail
- UI auto-refresh so passive energy changes appear during testing

## Notes
- regen is applied during player load/bootstrap and before actions, so it works without requiring the worker to be online
- energy still caps at 100
- the layout is inspired by Torn's structure, but remains original and uses no licensable assets
