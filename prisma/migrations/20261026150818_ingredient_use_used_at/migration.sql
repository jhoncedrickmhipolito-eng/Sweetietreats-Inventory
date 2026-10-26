-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_IngredientUse" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "cost" REAL NOT NULL,
    "usedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IngredientUse_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_IngredientUse" ("cost", "createdAt", "id", "productId", "productName", "quantity", "unitPrice") SELECT "cost", "createdAt", "id", "productId", "productName", "quantity", "unitPrice" FROM "IngredientUse";
DROP TABLE "IngredientUse";
ALTER TABLE "new_IngredientUse" RENAME TO "IngredientUse";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
