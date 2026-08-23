-- Preserve legacy attendance rows while recording the authoritative class section for new check-ins.
ALTER TABLE "attendances"
  ADD COLUMN "classSectionId" TEXT;

ALTER TABLE "attendances"
  ADD CONSTRAINT "attendances_classSectionId_fkey"
  FOREIGN KEY ("classSectionId") REFERENCES "class_sections"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "attendances_classSectionId_idx" ON "attendances"("classSectionId");
