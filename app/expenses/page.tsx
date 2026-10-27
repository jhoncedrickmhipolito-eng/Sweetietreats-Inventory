import { prisma } from "@/lib/db";
import Link from "next/link";
import ActionForm from "@/components/ActionForm";
import HistoryControls from "@/components/HistoryControls";
import PrintButton from "@/components/PrintButton";
import CsvLink from "@/components/CsvLink";
import { addExpense, deleteExpense } from "@/lib/actions";
import { getDateFilter, toDateTimeLocal } from "@/lib/dateFilter";

// Always render fresh from the database (no static prerender).
export const instant = false;

const peso = (n: number) =>
  n.toLocaleString("en-PH", { style: "currency", currency: "PHP" });

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "amount-desc", label: "Highest amount" },
  { value: "amount-asc", label: "Lowest amount" },
];

function orderByFor(sort: string) {
  switch (sort) {
    case "oldest":
      return { occurredAt: "asc" } as const;
    case "amount-desc":
      return { amount: "desc" } as const;
    case "amount-asc":
      return { amount: "asc" } as const;
    default:
      return { occurredAt: "desc" } as const;
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

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filter = getDateFilter(sp, "occurredAt");
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 100) : "";
  const sort = typeof sp.sort === "string" ? sp.sort : "newest";
  const expenses = await prisma.expense.findMany({
    where: {
      ...filter.where,
      ...(q ? { description: { contains: q } } : {}),
    },
    orderBy: orderByFor(sort),
  });

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const filtering = Boolean(filter.from || filter.to);

  const exportQuery = new URLSearchParams({ table: "expenses", sort });
  if (filter.from) exportQuery.set("from", filter.from);
  if (filter.to) exportQuery.set("to", filter.to);
  if (q) exportQuery.set("q", q);

  return (
    <div className="space-y-6">
      <section className="no-print rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-[#3d1a10]">Record Expense</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter how much you spent and what it was for.
        </p>
        <ActionForm
          action={addExpense}
          submitLabel="Save expense"
          className="mt-4 grid max-w-lg gap-3 sm:grid-cols-2"
        >
          <label className="grid gap-1 text-sm font-medium">
            Amount (PHP)
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="e.g. 250.00"
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Date &amp; time
            <input
              name="occurredAt"
              type="datetime-local"
              required
              defaultValue={toDateTimeLocal(new Date())}
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium sm:col-span-2">
            Description of the product
            <input
              name="description"
              type="text"
              required
              placeholder="e.g. Plastic containers for packaging"
              className="w-full rounded border border-gray-300 px-3 py-2"
            />
          </label>
        </ActionForm>
      </section>

      <section className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#3d1a10]">Expenses History</h2>
          <div className="flex flex-wrap items-end gap-2">
            <CsvLink href={`/api/export?${exportQuery.toString()}`} />
            <PrintButton />
          </div>
        </div>
        <div className="mt-3">
          <HistoryControls
            action="/expenses"
            from={filter.from}
            to={filter.to}
            q={q}
            sort={sort}
            sortOptions={SORT_OPTIONS}
            searchPlaceholder="Search description…"
          />
        </div>
        <p className="print-only mt-2 text-sm">
          Sweetie Treats — Expenses report ·{" "}
          {filtering ? `${filter.from} to ${filter.to}` : "All dates"} · Printed{" "}
          {formatDateTime(new Date())}
        </p>
        {expenses.length > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            {filtering ? "Total shown: " : "All time: "}
            <strong className="text-[#e7549d]">{peso(total)}</strong>
          </p>
        )}

        {expenses.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            {q
              ? "No expenses match your search."
              : filter.from || filter.to
                ? "No expenses in this date range."
                : "No expenses recorded yet."}
          </p>
        ) : (
          <table className="mt-4 w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                <th className="py-2 pr-4 font-semibold">Description</th>
                <th className="py-2 pr-4 font-semibold">Amount</th>
                <th className="py-2 pr-4 font-semibold">Date &amp; time</th>
                <th className="no-print py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="py-3 pr-4 font-medium">{expense.description}</td>
                  <td className="py-3 pr-4 font-semibold text-red-700">
                    {peso(expense.amount)}
                  </td>
                  <td className="py-3 pr-4 text-[11px] leading-tight text-gray-400">
                    {formatDateTime(expense.occurredAt)}
                  </td>
                  <td className="no-print py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/expenses/edit/${expense.id}`}
                        className="rounded-full bg-gray-200 px-4 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-300"
                      >
                        Edit
                      </Link>
                      <ActionForm
                        action={deleteExpense}
                        submitLabel="Delete"
                        variant="danger"
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="id" value={expense.id} />
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
