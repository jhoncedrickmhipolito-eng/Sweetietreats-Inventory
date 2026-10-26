// Small diagnostic script: prints current rows in the SQLite database.
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  console.log("financeEntries:", JSON.stringify(await p.financeEntry.findMany(), null, 2));
  console.log("products:", JSON.stringify(await p.product.findMany(), null, 2));
  console.log("ingredientUses:", JSON.stringify(await p.ingredientUse.findMany(), null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => p.$disconnect());
