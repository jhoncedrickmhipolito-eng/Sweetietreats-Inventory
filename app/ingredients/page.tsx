import { prisma } from "@/lib/db";
import Link from "next/link";
import ActionForm from "@/components/ActionForm";
import HistoryControls from "@/components/HistoryControls";
import PrintButton from "@/components/PrintButton";
import CsvLink from "@/components/CsvLink";
import { addIngredientUse, deleteIngredientUse } from "@/lib/actions";
import { getDateFilter, toDateTimeLocal } from "@/lib/dateFilter";

// Always render fresh from the database (no static prerender).
export const instant = false;

const peso = (n: number) =>
  n.toLocaleString("en-PH", { style: "currency", currency: "PHP" });

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "cost-desc", label: "Highest cost" },
  { value: "cost-asc", label: "Lowest cost" },
];

function orderByFor(sort: string) {
  switch (sort) {
    case "oldest":
      return { usedAt: "asc" } as const;
    case "cost-desc":
      return { cost: "desc" } as const;
    case "cost-asc":
      return { cost: "asc" } as const;
    default:
      return { usedAt: "desc" } as const;
  }
}

function formatDateTime(d: Date) {
  return d.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function IngredientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filter = getDateFilter(sp, "usedAt");
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const sort = typeof sp.sort === "string" ? sp.sort : "newest";
  const [products, uses] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.ingredientUse.findMany({
      where: {
        ...filter.where,
        ...(q ? { productName: { contains: q } } : {}),
      },
      orderBy: orderByFor(sort),
    }),
  ]);

  const totalCost = uses.reduce((sum, u) => sum + u.cost, 0);
  const filtering = Boolean(filter.from || filter.to);

  const exportQuery = new URLSearchParams({ table: "ingredients", sort });
  if (filter.from) exportQuery.set("from", filter.from);
  if (filter.to) exportQuery.set("to", filter.to);
  if (q) exportQuery.set("q", q);

  return (
    <div className="space-y-6">
      <section className="no-print rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-[#3d1a10]">Use Ingredients</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pick a product from stock and enter how much you used. The stock is reduced
          automatically and the cost is calculated from the stock price.
        </p>

        {products.length === 0 ? (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
            No products in stock yet. Add products in the Stock tab first.
          </p>
        ) : (
          <ActionForm
            action={addIngredientUse}
            submitLabel="Use ingredient"
            className="mt-4 grid max-w-lg gap-3 sm:grid-cols-3"
          >
            <label className="grid gap-1 text-sm font-medium sm:col-span-3">
              Product
              <select
                name="productId"
                required
                className="rounded border border-gray-300 px-3 py-2"
                defaultValue=""
              >
                <option value="" disabled>
                  Choose a product…
                </option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.quantity} in stock ({peso(p.price)} each)
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Amount used
              <input
                name="quantity"
                type="number"
                step="1"
                min="1"
                required
                placeholder="e.g. 1"
                className="rounded border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Date &amp; time
              <input
                name="usedAt"
                type="datetime-local"
                required
                defaultValue={toDateTimeLocal(new Date())}
                className="rounded border border-gray-300 px-3 py-2"
              />
            </label>
          </ActionForm>
        )}
      </section>

      <section className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#3d1a10]">Ingredient Costs</h2>
          <div className="flex flex-wrap items-end gap-2">
            <CsvLink href={`/api/export?${exportQuery.toString()}`} />
            <PrintButton />
          </div>
        </div>
        <div className="mt-3">
          <HistoryControls
            action="/ingredients"
            from={filter.from}
            to={filter.to}
            q={q}
            sort={sort}
            sortOptions={SORT_OPTIONS}
            searchPlaceholder="Search product name…"
          />
        </div>
        <p className="print-only mt-2 text-sm">
          Sweetie Treats — Ingredients report ·{" "}
          {filtering ? `${filter.from} to ${filter.to}` : "All dates"} · Printed{" "}
          {formatDateTime(new Date())}
        </p>
        {uses.length > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            {filtering ? "Total shown: " : "All time: "}
            <strong className="text-pink-700">{peso(totalCost)}</strong>
          </p>
        )}

        {uses.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            {q
              ? "No ingredient uses match your search."
              : filtering
                ? "No ingredient uses in this date range."
                : "No ingredients used yet."}
          </p>
        ) : (
          <table className="mt-4 w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <th className="py-2 pr-4 font-semibold">Product</th>
                <th className="py-2 pr-4 font-semibold">Used</th>
                <th className="py-2 pr-4 font-semibold">Date &amp; time</th>
                <th className="py-2 pr-4 font-semibold">Cost</th>
                <th className="no-print py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {uses.map((use) => (
                <tr key={use.id}>
                  <td className="py-3 pr-4 font-medium">{use.productName}</td>
                  <td className="py-3 pr-4 text-gray-600">
                    {use.quantity} × {peso(use.unitPrice)}
                  </td>
                  <td className="py-3 pr-4 text-[11px] leading-tight text-gray-400">
                    {formatDateTime(use.usedAt)}
                  </td>
                  <td className="py-3 pr-4 font-semibold text-pink-700">{peso(use.cost)}</td>
                  <td className="no-print py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/ingredients/edit/${use.id}`}
                        className="rounded-full bg-gray-200 px-4 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-300"
                      >
                        Edit
                      </Link>
                      <ActionForm
                        action={deleteIngredientUse}
                        submitLabel="Delete"
                        variant="danger"
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="id" value={use.id} />
                        <input
                          name="password"
                          type="password"
                          required
                          placeholder="password"
                          autoComplete="off"
                          className="rounded border border-gray-300 px-2 py-1 text-sm"
                        />
                      </ActionForm>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
