# Premium Billing Plan

## Important
Do not accept real money until:
- entitlement expiry is enforced server-side
- premium currency is ledgered
- duplicate payment handling exists
- manual refunds can be reconciled
- chargebacks cannot silently duplicate benefits

## Alpha-safe approach
For now:
- keep PayPal as a mock/test flow or sandbox
- create premium ledger rows
- compute benefits from entitlement dates, not from client UI flags

## Required server fields
- `premiumUntil`
- `premiumAutoRenew`
- `premiumProvider`
- `premiumProviderSubId`
- `premiumCoins`
- `premiumLedger[]`

## Benefits
- max energy 150 while active
- energy regen 10 every 10 minutes while active
- bravery regen 1 every 4 minutes while active
- +100 premium coins at initial purchase
- on expiry: max energy returns to 100 and current energy is clamped to 100
