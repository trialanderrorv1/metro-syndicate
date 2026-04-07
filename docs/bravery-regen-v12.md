# Bravery regen adjustment

## Included
- bravery now regenerates at 1 point every 5 minutes
- added `braveryUpdatedAt` to player state so bravery regen is server-authoritative
- crimes update the bravery regen anchor when they spend bravery
- recover resets bravery to full and resets its regen anchor
- right-side UI panel now shows the next bravery tick countdown

## Current timed resources
- energy: +5 every 10 minutes, cap 100
- bravery: +1 every 5 minutes, cap 20
