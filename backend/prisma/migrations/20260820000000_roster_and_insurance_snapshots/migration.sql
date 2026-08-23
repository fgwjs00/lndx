-- Preserve the data that was approved for a registration and roster member.
-- This migration is additive and safe to rehearse on a restored database.

ALTER TABLE "enrollment_applications"
  ADD COLUMN "insuranceSnapshot" JSONB;

ALTER TABLE "roster_members"
  ADD COLUMN "snapshot" JSONB;
