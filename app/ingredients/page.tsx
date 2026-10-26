import { prisma } from "@/lib/db";
import ActionForm from "@/components/ActionForm";
import DateFilter from "@/components/DateFilter";
import { addIngredientUse, deleteIngredientUse } from "@/lib/actions";
import { getDateFilter } from "@/lib/dateFilter";

// Always render fresh from the database (no static prerender).
export const instant = false;

const peso = (n: number) =>
  n.toLocaleString("en-PH", { style: "currency", currency: "PHP" });

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
  const filter = getDateFilter(await searchParams);
  const [products, uses] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.ingredientUse.findMany({
      where: filter.where,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalCost = uses.reduce((sum, u) => sum + u.cost, 0);
  const filtering = Boolean(filter.from || filter.to);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
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
          </ActionForm>
        )}
      </section>

      <section className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#3d1a10]">Ingredient Costs</h2>
          <DateFilter from={filter.from} to={filter.to} />
        </div>
        {uses.length > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            {filtering ? "Total shown: " : "All time: "}
            <strong className="text-pink-700">{peso(totalCost)}</strong>
          </p>
        )}

        {uses.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            {filtering ? "No ingredient uses in this date range." : "No ingredients used yet."}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100">
            {uses.map((use) => (
              <li key={use.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <span className="w-40 text-sm text-gray-500">
                  {formatDateTime(use.createdAt)}
                </span>
                <span className="font-medium">{use.productName}</span>
                <span className="text-sm text-gray-600">
                  {use.quantity} × {peso(use.unitPrice)}
                </span>
                <span className="text-sm font-semibold text-pink-700">{peso(use.cost)}</span>
                <ActionForm
                  action={deleteIngredientUse}
                  submitLabel="Delete"
                  variant="danger"
                  className="ml-auto flex items-center gap-2"
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
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
