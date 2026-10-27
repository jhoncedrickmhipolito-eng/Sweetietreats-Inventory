import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/export?table=money|expenses|ingredients|stock[&from=YYYY-MM-DD][&to=YYYY-MM-DD][&q=text][&sort=...]
// Downloads the same rows the matching history page shows, as a CSV file.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}

function fmtDateTime(d: Date) {
  return d.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function rangeFrom(sp: URLSearchParams) {
  const rawFrom = sp.get("from") ?? "";
  const rawTo = sp.get("to") ?? "";
  const from = DATE_RE.test(rawFrom) ? rawFrom : "";
  const to = DATE_RE.test(rawTo) ? rawTo : "";
  const range: { gte?: Date; lte?: Date } = {};
  if (from) range.gte = new Date(`${from}T00:00:00`);
  if (to) range.lte = new Date(`${to}T23:59:59.999`);
  return { from, to, range };
}

function qFrom(sp: URLSearchParams): string {
  return (sp.get("q") ?? "").trim().slice(0, 100);
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const table = sp.get("table") ?? "";
  const sort = sp.get("sort") ?? "";
  const q = qFrom(sp);
  const { from, to, range } = rangeFrom(sp);
  const hasRange = Boolean(from || to);
  const today = new Date().toISOString().slice(0, 10);

  let rows: (string | number)[][];
  let header: string[];
  let filename: string;

  switch (table) {
    case "money": {
      const entries = await prisma.financeEntry.findMany({
        where: hasRange ? { occurredAt: range } : undefined,
        orderBy:
          sort === "oldest"
            ? { occurredAt: "asc" }
            : sort === "income-desc"
              ? { income: "desc" }
              : sort === "income-asc"
                ? { income: "asc" }
                : { occurredAt: "desc" },
      });
      header = ["Date & time", "Income", "Capital", "Profit"];
      rows = entries.map((e) => [
        fmtDateTime(e.occurredAt),
        e.income.toFixed(2),
        e.capital.toFixed(2),
        e.profit.toFixed(2),
      ]);
      filename = `sweetie-treats-money-${today}.csv`;
      break;
    }
    case "expenses": {
      const expenses = await prisma.expense.findMany({
        where: {
          ...(hasRange ? { occurredAt: range } : {}),
          ...(q ? { description: { contains: q } } : {}),
        },
        orderBy:
          sort === "oldest"
            ? { occurredAt: "asc" }
            : sort === "amount-desc"
              ? { amount: "desc" }
              : sort === "amount-asc"
                ? { amount: "asc" }
                : { occurredAt: "desc" },
      });
      header = ["Date & time", "Description", "Amount"];
      rows = expenses.map((e) => [
        fmtDateTime(e.occurredAt),
        e.description,
        e.amount.toFixed(2),
      ]);
      filename = `sweetie-treats-expenses-${today}.csv`;
      break;
    }
    case "ingredients": {
      const uses = await prisma.ingredientUse.findMany({
        where: {
          ...(hasRange ? { usedAt: range } : {}),
          ...(q ? { productName: { contains: q } } : {}),
        },
        orderBy:
          sort === "oldest"
            ? { usedAt: "asc" }
            : sort === "cost-desc"
              ? { cost: "desc" }
              : sort === "cost-asc"
                ? { cost: "asc" }
                : { usedAt: "desc" },
      });
      header = ["Date & time", "Product", "Quantity", "Unit price", "Cost"];
      rows = uses.map((u) => [
        fmtDateTime(u.usedAt),
        u.productName,
        u.quantity,
        u.unitPrice.toFixed(2),
        u.cost.toFixed(2),
      ]);
      filename = `sweetie-treats-ingredients-${today}.csv`;
      break;
    }
    case "stock": {
      const products = await prisma.product.findMany({
        where: q ? { name: { contains: q } } : undefined,
        orderBy:
          sort === "name-desc"
            ? { name: "desc" }
            : sort === "price-desc"
              ? { price: "desc" }
              : sort === "price-asc"
                ? { price: "asc" }
                : sort === "qty-desc"
                  ? { quantity: "desc" }
                  : sort === "qty-asc"
                    ? { quantity: "asc" }
                    : { name: "asc" },
      });
      header = ["Product", "Price each", "Quantity", "Line value"];
      rows = products.map((p) => [
        p.name,
        p.price.toFixed(2),
        p.quantity,
        (p.price * p.quantity).toFixed(2),
      ]);
      filename = `sweetie-treats-stock-${today}.csv`;
      break;
    }
    default:
      return new Response("Unknown export type. Use table=money|expenses|ingredients|stock.", {
        status: 400,
      });
  }

  const body = "\uFEFF" + csv([header, ...rows]); // BOM so Excel reads ₱ correctly
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
