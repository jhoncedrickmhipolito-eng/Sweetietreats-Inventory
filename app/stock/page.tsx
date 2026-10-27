import { prisma } from "@/lib/db";
import ActionForm from "@/components/ActionForm";
import StockQtyInput from "@/components/StockQtyInput";
import { addProduct, deleteProduct } from "@/lib/actions";

// Always render fresh from the database (no static prerender).
export const instant = false;

const peso = (n: number) =>
  n.toLocaleString("en-PH", { style: "currency", currency: "PHP" });

export default async function StockPage() {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  const stockValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
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
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-[#3d1a10]">Stock</h2>
          <span className="text-sm text-gray-500">
            Total value: <strong>{peso(stockValue)}</strong>
          </span>
        </div>

        {products.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No products yet. Add one above.</p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100">
            {products.map((product) => (
              <li key={product.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <span className="font-medium">{product.name}</span>
                <span className="text-sm text-gray-500">{peso(product.price)} each</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-sm font-semibold ${
                    product.quantity === 0
                      ? "bg-red-100 text-red-700"
                      : product.quantity <= 3
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                  }`}
                >
                  {product.quantity} in stock
                </span>
                <StockQtyInput
                  productId={product.id}
                  initialQty={product.quantity}
                />
                <ActionForm action={deleteProduct} submitLabel="Delete" variant="danger" className="flex items-center">
                  <input type="hidden" name="id" value={product.id} />
                </ActionForm>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
