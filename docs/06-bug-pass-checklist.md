# Bug Pass Checklist

## Timers
- energy fixed ticks
- bravery fixed ticks
- premium energy tick override
- premium bravery tick override
- jail expiry
- hospital expiry
- premium expiry

## Inventory
- empty inventory for new account
- legacy inventory normalization
- equip/unequip by slot
- buy consumes cash
- use consumes item
- premium items never granted twice accidentally

## Combat
- fight costs correct energy
- loser goes to hospital
- no actions while hospitalized/jail as intended
- weapon/armor modifiers apply correctly
- percentage modifiers display correctly

## State migration
- old players missing new fields get normalized
- premium expiry clamps energy
- old equipment layouts are converted
- no crash on missing forum/premium fields
