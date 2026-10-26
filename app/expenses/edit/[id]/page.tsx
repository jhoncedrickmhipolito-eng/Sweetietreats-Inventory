import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import ActionForm from "@/components/ActionForm";
import { updateExpense } from "@/lib/actions";

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

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) notFound();

  const expense = await prisma.expense.findUnique({ where: { id: numericId } });
  if (!expense) notFound();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-[#3d1a10]">Edit Expense</h1>
        <p className="mt-1 text-sm text-gray-500">
          Recorded on {formatDateTime(expense.createdAt)}.
        </p>
        <ActionForm
          action={updateExpense}
          submitLabel="Save changes"
          className="mt-4 grid max-w-lg gap-3"
        >
          <input type="hidden" name="id" value={expense.id} />
          <label className="grid gap-1 text-sm font-medium">
            Amount (PHP)
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={expense.amount}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Description of the product
            <input
              name="description"
              type="text"
              required
              defaultValue={expense.description}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
        </ActionForm>
        <Link
          href="/expenses"
          className="mt-4 inline-block rounded-full bg-gray-200 px-4 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-300"
        >
          Back to Expenses
        </Link>
      </section>
    </div>
  );
}
