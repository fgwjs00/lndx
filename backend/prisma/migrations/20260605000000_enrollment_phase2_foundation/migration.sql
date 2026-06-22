-- Enrollment phase 2 foundation.
-- This migration creates new tables only; it does not mutate existing enrollment data.

-- CreateEnum
CREATE TYPE "RosterStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RosterMemberStatus" AS ENUM ('ACTIVE', 'DROPPED', 'TRANSFERRED', 'GRADUATED');

-- CreateEnum
CREATE TYPE "EnrollmentApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EnrollmentChoiceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WAITLISTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InsuranceReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "academic_years" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "enrollmentStartsAt" TIMESTAMP(3),
    "enrollmentEndsAt" TIMESTAMP(3),
    "requiredInsuranceStart" TIMESTAMP(3) NOT NULL,
    "requiredInsuranceEnd" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semesters" (
    "id" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isEnrollmentOpen" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_sections" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "grade" TEXT,
    "major" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "timeSlots" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rosters" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "classSectionId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "status" "RosterStatus" NOT NULL DEFAULT 'DRAFT',
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rosters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roster_members" (
    "id" TEXT NOT NULL,
    "rosterId" TEXT NOT NULL,
    "classSectionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sourceEnrollmentId" TEXT,
    "status" "RosterMemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roster_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_applications" (
    "id" TEXT NOT NULL,
    "applicationCode" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "insuranceId" TEXT,
    "status" "EnrollmentApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "source" TEXT NOT NULL DEFAULT 'SELF_SERVICE',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollment_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollment_application_choices" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "choiceOrder" INTEGER NOT NULL,
    "classSectionId" TEXT NOT NULL,
    "status" "EnrollmentChoiceStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollment_application_choices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_insurances" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "category" TEXT,
    "coverageStart" TIMESTAMP(3) NOT NULL,
    "coverageEnd" TIMESTAMP(3) NOT NULL,
    "attachmentFileId" TEXT,
    "reviewStatus" "InsuranceReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_insurances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_code_key" ON "academic_years"("code");
CREATE UNIQUE INDEX "semesters_code_key" ON "semesters"("code");
CREATE INDEX "semesters_academicYearId_idx" ON "semesters"("academicYearId");
CREATE UNIQUE INDEX "class_sections_code_key" ON "class_sections"("code");
CREATE INDEX "class_sections_academicYearId_semesterId_idx" ON "class_sections"("academicYearId", "semesterId");
CREATE INDEX "class_sections_courseId_idx" ON "class_sections"("courseId");
CREATE UNIQUE INDEX "rosters_code_key" ON "rosters"("code");
CREATE UNIQUE INDEX "rosters_classSectionId_semesterId_key" ON "rosters"("classSectionId", "semesterId");
CREATE INDEX "rosters_semesterId_idx" ON "rosters"("semesterId");
CREATE UNIQUE INDEX "roster_members_rosterId_studentId_key" ON "roster_members"("rosterId", "studentId");
CREATE INDEX "roster_members_classSectionId_status_idx" ON "roster_members"("classSectionId", "status");
CREATE INDEX "roster_members_studentId_idx" ON "roster_members"("studentId");
CREATE UNIQUE INDEX "enrollment_applications_applicationCode_key" ON "enrollment_applications"("applicationCode");
CREATE INDEX "enrollment_applications_studentId_academicYearId_idx" ON "enrollment_applications"("studentId", "academicYearId");
CREATE INDEX "enrollment_applications_semesterId_status_idx" ON "enrollment_applications"("semesterId", "status");
CREATE UNIQUE INDEX "enrollment_application_choices_applicationId_choiceOrder_key" ON "enrollment_application_choices"("applicationId", "choiceOrder");
CREATE UNIQUE INDEX "enrollment_application_choices_applicationId_classSectionId_key" ON "enrollment_application_choices"("applicationId", "classSectionId");
CREATE INDEX "enrollment_application_choices_classSectionId_status_idx" ON "enrollment_application_choices"("classSectionId", "status");
CREATE INDEX "student_insurances_studentId_academicYearId_idx" ON "student_insurances"("studentId", "academicYearId");
CREATE INDEX "student_insurances_academicYearId_reviewStatus_idx" ON "student_insurances"("academicYearId", "reviewStatus");

-- AddForeignKey
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "class_sections" ADD CONSTRAINT "class_sections_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "class_sections" ADD CONSTRAINT "class_sections_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "class_sections" ADD CONSTRAINT "class_sections_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rosters" ADD CONSTRAINT "rosters_classSectionId_fkey" FOREIGN KEY ("classSectionId") REFERENCES "class_sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rosters" ADD CONSTRAINT "rosters_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rosters" ADD CONSTRAINT "rosters_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "roster_members" ADD CONSTRAINT "roster_members_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "rosters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "roster_members" ADD CONSTRAINT "roster_members_classSectionId_fkey" FOREIGN KEY ("classSectionId") REFERENCES "class_sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "roster_members" ADD CONSTRAINT "roster_members_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "roster_members" ADD CONSTRAINT "roster_members_sourceEnrollmentId_fkey" FOREIGN KEY ("sourceEnrollmentId") REFERENCES "enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "enrollment_applications" ADD CONSTRAINT "enrollment_applications_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "enrollment_applications" ADD CONSTRAINT "enrollment_applications_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "enrollment_applications" ADD CONSTRAINT "enrollment_applications_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "enrollment_applications" ADD CONSTRAINT "enrollment_applications_insuranceId_fkey" FOREIGN KEY ("insuranceId") REFERENCES "student_insurances"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "enrollment_application_choices" ADD CONSTRAINT "enrollment_application_choices_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "enrollment_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "enrollment_application_choices" ADD CONSTRAINT "enrollment_application_choices_classSectionId_fkey" FOREIGN KEY ("classSectionId") REFERENCES "class_sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_insurances" ADD CONSTRAINT "student_insurances_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_insurances" ADD CONSTRAINT "student_insurances_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "student_insurances" ADD CONSTRAINT "student_insurances_attachmentFileId_fkey" FOREIGN KEY ("attachmentFileId") REFERENCES "file_uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
