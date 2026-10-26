import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import ActionForm from "@/components/ActionForm";
import { updateFinanceEntry } from "@/lib/actions";
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

export default async function EditFinancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) notFound();

  const entry = await prisma.financeEntry.findUnique({ where: { id: numericId } });
  if (!entry) notFound();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-[#3d1a10]">Edit Money Entry</h1>
        <p className="mt-1 text-sm text-gray-500">
          Income from {formatDateTime(entry.occurredAt)}. Profit is recalculated
          automatically (income minus capital).
        </p>
        <ActionForm
          action={updateFinanceEntry}
          submitLabel="Save changes"
          className="mt-4 grid max-w-md gap-3"
        >
          <input type="hidden" name="id" value={entry.id} />
          <label className="grid gap-1 text-sm font-medium">
            Income (PHP)
            <input
              name="income"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={entry.income}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Capital (PHP)
            <input
              name="capital"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={entry.capital}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Date &amp; time
            <input
              name="occurredAt"
              type="datetime-local"
              required
              defaultValue={toDateTimeLocal(entry.occurredAt)}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
        </ActionForm>
        <Link
          href="/finance"
          className="mt-4 inline-block rounded-full bg-gray-200 px-4 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-300"
        >
          Back to Money
        </Link>
      </section>
    </div>
  );
}
