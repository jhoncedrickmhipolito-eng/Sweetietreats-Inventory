import { prisma } from "@/lib/db";
import Link from "next/link";
import ActionForm from "@/components/ActionForm";
import StockQtyInput from "@/components/StockQtyInput";
import PrintButton from "@/components/PrintButton";
import CsvLink from "@/components/CsvLink";
import HistoryControls from "@/components/HistoryControls";
import { addProduct, deleteProduct } from "@/lib/actions";

// Always render fresh from the database (no static prerender).
export const instant = false;

const peso = (n: number) =>
  n.toLocaleString("en-PH", { style: "currency", currency: "PHP" });

const SORT_OPTIONS = [
  { value: "name-asc", label: "Name A → Z" },
  { value: "name-desc", label: "Name Z → A" },
  { value: "price-desc", label: "Price high → low" },
  { value: "price-asc", label: "Price low → high" },
  { value: "qty-desc", label: "Most in stock" },
  { value: "qty-asc", label: "Least in stock" },
];

function orderByFor(sort: string) {
  switch (sort) {
    case "name-desc":
      return { name: "desc" } as const;
    case "price-desc":
      return { price: "desc" } as const;
    case "price-asc":
      return { price: "asc" } as const;
    case "qty-desc":
      return { quantity: "desc" } as const;
    case "qty-asc":
      return { quantity: "asc" } as const;
    default:
      return { name: "asc" } as const;
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

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const sort = typeof sp.sort === "string" ? sp.sort : "name-asc";

  const products = await prisma.product.findMany({
    where: q ? { name: { contains: q } } : undefined,
    orderBy: orderByFor(sort),
  });

  const stockValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

  const exportQuery = new URLSearchParams({ table: "stock", sort });
  if (q) exportQuery.set("q", q);

  return (
    <div className="space-y-6">
      <section className="no-print rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-[#3d1a10]">Add Product to Stock</h1>
        <ActionForm
          action={addProduct}
          submitLabel="Add product"
          className="mt-4 grid max-w-lg gap-3 sm:grid-cols-3"
        >
          <label className="grid gap-1 text-sm font-medium sm:col-span-3">
            Product name
            <input
              name="name"
              type="text"
              required
              placeholder="e.g. Condensed milk"
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Price each (PHP)
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="e.g. 45.00"
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Quantity
            <input
              name="quantity"
              type="number"
              step="1"
              min="0"
              required
              placeholder="e.g. 3"
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
        </ActionForm>
      </section>

      <section className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#3d1a10]">Stock</h2>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-500">
              Total value: <strong>{peso(stockValue)}</strong>
            </span>
            <CsvLink href={`/api/export?${exportQuery.toString()}`} />
            <PrintButton />
          </div>
        </div>
        <div className="mt-3">
          <HistoryControls
            action="/stock"
            from=""
            to=""
            q={q}
            sort={sort}
            sortOptions={SORT_OPTIONS}
            searchPlaceholder="Search product name…"
          />
        </div>
        <p className="print-only mt-2 text-sm">
          Sweetie Treats — Stock report (current stock) · Printed{" "}
          {formatDateTime(new Date())}
        </p>

        {products.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            {q ? "No products match your search." : "No products yet. Add one above."}
          </p>
        ) : (
          <table className="mt-4 w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <th className="py-2 pr-4 font-semibold">Product</th>
                <th className="py-2 pr-4 font-semibold">Price each</th>
                <th className="py-2 pr-4 font-semibold">In stock</th>
                <th className="no-print py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="py-3 pr-4 font-medium">{product.name}</td>
                  <td className="py-3 pr-4 text-gray-500">{peso(product.price)}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-sm font-semibold ${
                        product.quantity === 0
                          ? "bg-red-100 text-red-700"
                          : product.quantity <= 3
                            ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"
                      }`}
                    >
                      {product.quantity}
                    </span>
                  </td>
                  <td className="no-print py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/stock/edit/${product.id}`}
                        className="rounded-full bg-gray-200 px-4 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-300"
                      >
                        Edit
                      </Link>
                      <StockQtyInput
                        productId={product.id}
                        initialQty={product.quantity}
                      />
                      <ActionForm
                        action={deleteProduct}
                        submitLabel="Delete"
                        variant="danger"
                        className="flex items-center"
                      >
                        <input type="hidden" name="id" value={product.id} />
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
