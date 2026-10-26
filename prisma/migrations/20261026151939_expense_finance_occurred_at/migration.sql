-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Expense" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Expense" ("amount", "createdAt", "description", "id") SELECT "amount", "createdAt", "description", "id" FROM "Expense";
DROP TABLE "Expense";
ALTER TABLE "new_Expense" RENAME TO "Expense";
CREATE TABLE "new_FinanceEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "income" REAL NOT NULL,
    "capital" REAL NOT NULL,
    "profit" REAL NOT NULL,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_FinanceEntry" ("capital", "createdAt", "id", "income", "profit") SELECT "capital", "createdAt", "id", "income", "profit" FROM "FinanceEntry";
DROP TABLE "FinanceEntry";
ALTER TABLE "new_FinanceEntry" RENAME TO "FinanceEntry";
-- Backfill: existing rows keep the time they were actually recorded.
UPDATE "Expense" SET "occurredAt" = "createdAt";
UPDATE "FinanceEntry" SET "occurredAt" = "createdAt";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
