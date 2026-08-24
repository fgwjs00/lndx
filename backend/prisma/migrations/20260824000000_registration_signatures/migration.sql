-- Keep the exact signature submitted with each self-service enrollment application.
ALTER TABLE "enrollment_applications"
  ADD COLUMN "signatureFileId" TEXT,
  ADD COLUMN "signatureSnapshot" JSONB;

CREATE UNIQUE INDEX "enrollment_applications_signatureFileId_key"
  ON "enrollment_applications"("signatureFileId");

ALTER TABLE "enrollment_applications"
  ADD CONSTRAINT "enrollment_applications_signatureFileId_fkey"
  FOREIGN KEY ("signatureFileId")
  REFERENCES "file_uploads"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
