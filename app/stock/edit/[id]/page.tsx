import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import ActionForm from "@/components/ActionForm";
import { updateProduct } from "@/lib/actions";

// Always render fresh from the database (no static prerender).
export const instant = false;

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) notFound();

  const product = await prisma.product.findUnique({ where: { id: numericId } });
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-[#3d1a10]">Edit Product</h1>
        <p className="mt-1 text-sm text-gray-500">
          Fix the name, price, or starting quantity of <strong>{product.name}</strong>.
          Past ingredient records keep the name they were saved with.
        </p>
        <ActionForm
          action={updateProduct}
          submitLabel="Save changes"
          className="mt-4 grid max-w-md gap-3 sm:grid-cols-2"
        >
          <input type="hidden" name="id" value={product.id} />
          <label className="grid gap-1 text-sm font-medium sm:col-span-2">
            Product name
            <input
              name="name"
              type="text"
              required
              defaultValue={product.name}
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
              defaultValue={product.price}
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
              defaultValue={product.quantity}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
        </ActionForm>
        <Link
          href="/stock"
          className="mt-4 inline-block rounded-full bg-gray-200 px-4 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-300"
        >
          Back to Stock
        </Link>
      </section>
    </div>
  );
}
