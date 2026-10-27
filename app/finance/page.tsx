import { prisma } from "@/lib/db";
import Link from "next/link";
import ActionForm from "@/components/ActionForm";
import DateFilter from "@/components/DateFilter";
import PrintButton from "@/components/PrintButton";
import { addFinanceEntry, deleteFinanceEntry } from "@/lib/actions";
import { getDateFilter, toDateTimeLocal } from "@/lib/dateFilter";

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

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filter = getDateFilter(await searchParams, "occurredAt");
  const entries = await prisma.financeEntry.findMany({
    where: filter.where,
    orderBy: { occurredAt: "desc" },
  });

  const totals = entries.reduce(
    (acc, e) => ({
      income: acc.income + e.income,
      capital: acc.capital + e.capital,
      profit: acc.profit + e.profit,
    }),
    { income: 0, capital: 0, profit: 0 },
  );

  const filtering = Boolean(filter.from || filter.to);

  return (
    <div className="space-y-6">
      <section className="no-print rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-[#3d1a10]">Record Income</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter the income and how much of it is capital. Profit is calculated automatically
          (income minus capital).
        </p>
        <ActionForm
          action={addFinanceEntry}
          submitLabel="Save entry"
          className="mt-4 grid max-w-md gap-3 sm:grid-cols-2"
        >
          <label className="grid gap-1 text-sm font-medium">
            Income (PHP)
            <input
              name="income"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="e.g. 1000.00"
              className="rounded border border-gray-300 px-3 py-2"
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
              placeholder="e.g. 600.00"
              className="rounded border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium sm:col-span-2">
            Date &amp; time
            <input
              name="occurredAt"
              type="datetime-local"
              required
              defaultValue={toDateTimeLocal(new Date())}
              className="rounded border border-gray-300 px-3 py-2"
            />
          </label>
        </ActionForm>
      </section>

      <section className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#3d1a10]">History</h2>
          <div className="flex flex-wrap items-end gap-2">
            <DateFilter from={filter.from} to={filter.to} />
            <PrintButton />
          </div>
        </div>
        <p className="print-only mt-2 text-sm">
          Sweetie Treats — Money report ·{" "}
          {filtering ? `${filter.from} to ${filter.to}` : "All dates"} · Printed{" "}
          {formatDateTime(new Date())}
        </p>

        {entries.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            {filter.from || filter.to
              ? "No entries in this date range."
              : "No entries yet."}
          </p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-pink-100 p-3">
                <div className="text-xs text-pink-700">Entries</div>
                <div className="text-lg font-bold">{entries.length}</div>
              </div>
              <div className="rounded-lg bg-gray-100 p-3">
                <div className="text-xs text-gray-600">Income</div>
                <div className="text-lg font-bold">{peso(totals.income)}</div>
              </div>
              <div className="rounded-lg bg-blue-50 p-3">
                <div className="text-xs text-blue-700">Capital</div>
                <div className="text-lg font-bold">{peso(totals.capital)}</div>
              </div>
              <div className="rounded-lg bg-green-50 p-3">
                <div className="text-xs text-green-700">Profit</div>
                <div className="text-lg font-bold">{peso(totals.profit)}</div>
              </div>
            </div>

            <table className="mt-4 w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-2 pr-4 font-semibold">Date &amp; time</th>
                  <th className="py-2 pr-4 font-semibold">Income</th>
                  <th className="py-2 pr-4 font-semibold">Capital</th>
                  <th className="py-2 pr-4 font-semibold">Profit</th>
                  <th className="no-print py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="py-3 pr-4 text-[11px] leading-tight text-gray-400">
                      {formatDateTime(entry.occurredAt)}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-pink-700">
                      {peso(entry.income)}
                    </td>
                    <td className="py-3 pr-4 text-blue-700">{peso(entry.capital)}</td>
                    <td className="py-3 pr-4 text-green-700">{peso(entry.profit)}</td>
                    <td className="no-print py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/finance/edit/${entry.id}`}
                          className="rounded-full bg-gray-200 px-4 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-300"
                        >
                          Edit
                        </Link>
                        <ActionForm
                          action={deleteFinanceEntry}
                          submitLabel="Delete"
                          variant="danger"
                          className="flex items-center gap-2"
                        >
                          <input type="hidden" name="id" value={entry.id} />
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
          </>
        )}
      </section>
    </div>
  );
}
