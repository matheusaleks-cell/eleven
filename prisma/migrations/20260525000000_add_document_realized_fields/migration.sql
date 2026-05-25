-- AlterTable: add realized_value and realized_date to documents
ALTER TABLE "documents" ADD COLUMN "realized_value" REAL;
ALTER TABLE "documents" ADD COLUMN "realized_date" DATETIME;
