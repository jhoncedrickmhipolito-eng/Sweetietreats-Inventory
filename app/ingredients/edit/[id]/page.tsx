import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import ActionForm from "@/components/ActionForm";
import { updateIngredientUse } from "@/lib/actions";
import { toDateTimeLocal } from "@/lib/dateFilter";

// Always render fresh from the database (no static prerender).
export const instant = false;

function formatDateTime(d: Date) {
  return d.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function EditIngredientUsePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) notFound();

  const use = await prisma.ingredientUse.findUnique({ where: { id: numericId } });
  if (!use) notFound();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-[#3d1a10]">Edit Ingredient Use</h1>
        <p className="mt-1 text-sm text-gray-500">
          {use.productName} — used on {formatDateTime(use.usedAt)}. Cost is
          recalculated automatically (unit price × quantity).
        </p>
        <ActionForm
          action={updateIngredientUse}
          submitLabel="Save changes"
          className="mt-4 grid max-w-lg gap-3"
        >
          <input type="hidden" name="id" value={use.id} />
          <label className="grid gap-1 text-sm font-medium">
            Quantity used
            <input
              name="quantity"
              type="number"
              step="1"
              min="1"
              required
              defaultValue={use.quantity}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Unit price at time of use (PHP)
            <input
              name="unitPrice"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={use.unitPrice}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Date &amp; time used
            <input
              name="usedAt"
              type="datetime-local"
              required
              defaultValue={toDateTimeLocal(use.usedAt)}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
        </ActionForm>
        {use.productId !== null && (
          <p className="mt-3 text-xs text-gray-500">
            Changing the quantity adjusts your stock by the difference.
          </p>
        )}
        <Link
          href="/ingredients"
          className="mt-4 inline-block rounded-full bg-gray-200 px-4 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-300"
        >
          Back to Ingredients
        </Link>
      </section>
    </div>
  );
}
