/*
  Warnings:

  - Added the required column `productName` to the `IngredientUse` table without a default value. This is not possible if the table is not empty.

*/
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IngredientUse_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_IngredientUse" ("cost", "createdAt", "id", "productId", "productName", "quantity", "unitPrice")
SELECT "i"."cost", "i"."createdAt", "i"."id", "i"."productId",
       COALESCE((SELECT "p"."name" FROM "Product" "p" WHERE "p"."id" = "i"."productId"), 'deleted product'),
       "i"."quantity", "i"."unitPrice"
FROM "IngredientUse" "i";
DROP TABLE "IngredientUse";
ALTER TABLE "new_IngredientUse" RENAME TO "IngredientUse";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
