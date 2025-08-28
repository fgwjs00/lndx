-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "credits" INTEGER,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3),
ALTER COLUMN "courseCode" DROP NOT NULL,
ALTER COLUMN "price" DROP NOT NULL;
