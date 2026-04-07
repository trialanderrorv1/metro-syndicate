# Fixed wall-clock regeneration

## Regeneration schedule
- energy regenerates on fixed clock boundaries at `:00`, `:10`, `:20`, `:30`, `:40`, `:50`
- bravery regenerates on fixed clock boundaries at `:00`, `:05`, `:10`, `:15`, `:20`, `:25`, `:30`, `:35`, `:40`, `:45`, `:50`, `:55`

## Implementation notes
- regen is now based on wall-clock buckets rather than elapsed time since the last spend
- spending a resource no longer shifts its global tick schedule
- frontend countdowns now point to the next real clock boundary
- frontend schedules a refresh on the next 5-minute boundary so bars update at the fixed tick times during local testing
