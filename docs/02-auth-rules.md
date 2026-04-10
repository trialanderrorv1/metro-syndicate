# Account and Auth Rules

## Minimum rules for alpha
- unique username/handle
- email required for password reset
- password never stored in plaintext
- passwords hashed with a slow algorithm
- session tokens random and revocable
- session expiry enforced
- login attempts rate limited
- account lock after repeated failures
- admin actions audited

## Password rules
- minimum 10 characters
- block common passwords
- encourage passphrases over short complex strings
- rotate sessions after password change

## Session rules
- use secure, httpOnly cookies for web
- 7 day standard session
- 30 day remember-me only if explicitly chosen
- revoke all sessions on password reset
- revoke old sessions on suspicious login

## Alpha shortcuts allowed
- email verification can be deferred for closed alpha
- 2FA can be deferred
- but password hashing and session revocation should not be skipped
