# Jobs, crimes, jail, hospital, travel, and market overhaul

## Removed
- work action removed
- heat removed from gameplay/UI loop
- recover action removed

## Added / changed
- jail system for failed crimes with timed release windows
- failed crimes can now either jail the player or let them escape injured
- health regeneration added at +10 every 5 minutes on fixed ticks
- fight, hospital, and travel moved into dedicated left-panel sections
- jobs rebuilt into an 8-role daily-pay system with role bonuses
- players collect job pay once per day instead of running work shifts
- crime ladder expanded to 9 crimes total with level-based unlocks
- crime success now scales from player stats, job bonuses, and equipped utility bonuses
- market reorganized into Weapons, Armour, Utilities, and Recovery categories
- direct category purchasing kept alongside live player market listings
- recovery items now sit in their own category and can restore health, energy, or bravery

## Notes
- existing player JSON state is normalized automatically with defaults for the new fields
- passive regen is wall-clock aligned
- the UI now exposes the new loops directly instead of the old placeholder loop
