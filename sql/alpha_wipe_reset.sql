-- WARNING: Run only against an alpha/test environment.
-- This keeps account identity tables but resets gameplay state.

-- Example only. Adjust table names to your real schema.

-- Reset player state JSON / progression
-- UPDATE "Player" SET
--   "stateJson" = '{}'::jsonb,
--   "crewId" = NULL;

-- Clear economy tables
-- TRUNCATE TABLE "MarketListing" RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE "Contract" RESTART IDENTITY CASCADE;

-- Clear community content if desired
-- TRUNCATE TABLE "ForumThread" RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE "ForumPost" RESTART IDENTITY CASCADE;

-- Clear transient notifications
-- TRUNCATE TABLE "Notification" RESTART IDENTITY CASCADE;

-- Keep account identity and auth tables intact.
