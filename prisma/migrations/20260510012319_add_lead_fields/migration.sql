-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_leads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "company" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOVO',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "value" REAL NOT NULL DEFAULT 0,
    "source" TEXT,
    "assigned_seller_id" TEXT,
    "interests" TEXT,
    "documents" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "leads_assigned_seller_id_fkey" FOREIGN KEY ("assigned_seller_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_leads" ("assigned_seller_id", "company", "created_at", "documents", "email", "id", "interests", "name", "notes", "phone", "status", "updated_at") SELECT "assigned_seller_id", "company", "created_at", "documents", "email", "id", "interests", "name", "notes", "phone", "status", "updated_at" FROM "leads";
DROP TABLE "leads";
ALTER TABLE "new_leads" RENAME TO "leads";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
