-- Student academic event history.
-- This migration creates an append-only history table and does not mutate
-- existing student grade or major fields.

CREATE TABLE "student_academic_events" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "fromValue" TEXT,
    "toValue" TEXT,
    "reason" TEXT,
    "operatorId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_academic_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "student_academic_events_studentId_createdAt_idx"
    ON "student_academic_events"("studentId", "createdAt");

CREATE INDEX "student_academic_events_eventType_createdAt_idx"
    ON "student_academic_events"("eventType", "createdAt");

ALTER TABLE "student_academic_events"
    ADD CONSTRAINT "student_academic_events_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "students"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "student_academic_events"
    ADD CONSTRAINT "student_academic_events_operatorId_fkey"
    FOREIGN KEY ("operatorId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
