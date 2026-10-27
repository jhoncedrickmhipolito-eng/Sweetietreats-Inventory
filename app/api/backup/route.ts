import { prisma } from "@/lib/db";

// GET /api/backup — downloads every record as one JSON file.
// The matching restore lives in the Security tab (password required).
export async function GET() {
  const [products, financeEntries, expenses, ingredientUses] = await Promise.all([
    prisma.product.findMany(),
    prisma.financeEntry.findMany(),
    prisma.expense.findMany(),
    prisma.ingredientUse.findMany(),
  ]);

  const data = {
    app: "Sweetie Treats Inventory",
    version: 1,
    exportedAt: new Date().toISOString(),
    products,
    financeEntries,
    expenses,
    ingredientUses,
  };

  const today = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="sweetie-treats-backup-${today}.json"`,
    },
  });
}
