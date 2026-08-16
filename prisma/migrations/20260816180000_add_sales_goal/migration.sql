-- CreateTable: meta de faturamento mensal digitada manualmente pelo admin
CREATE TABLE "sales_goals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "target_value" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "sales_goals_month_year_key" ON "sales_goals"("month", "year");
