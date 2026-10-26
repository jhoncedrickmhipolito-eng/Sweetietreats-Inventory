import { prisma } from "@/lib/db";
import ActionForm from "@/components/ActionForm";
import DateFilter from "@/components/DateFilter";
import { addFinanceEntry, deleteFinanceEntry } from "@/lib/actions";
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

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filter = getDateFilter(await searchParams);
  const entries = await prisma.financeEntry.findMany({
    where: filter.where,
    orderBy: { createdAt: "desc" },
  });

  const totals = entries.reduce(
    (acc, e) => ({
      income: acc.income + e.income,
      capital: acc.capital + e.capital,
      profit: acc.profit + e.profit,
    }),
    { income: 0, capital: 0, profit: 0 },
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-[#3d1a10]">Record Income</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter the income and how much of it is capital. Profit is calculated automatically
          (income minus capital).
        </p>
        <ActionForm action={addFinanceEntry} submitLabel="Save entry" className="mt-4 grid max-w-md gap-3">
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
        </ActionForm>
      </section>

      <section className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#3d1a10]">History</h2>
          <DateFilter from={filter.from} to={filter.to} />
        </div>

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

            <ul className="mt-4 divide-y divide-gray-100">
              {entries.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                  <span className="w-40 text-sm text-gray-500">
                    {formatDateTime(entry.createdAt)}
                  </span>
                  <span className="text-sm">
                    <span className="text-gray-500">Income</span> {peso(entry.income)}
                  </span>
                  <span className="text-sm text-blue-700">Capital {peso(entry.capital)}</span>
                  <span className="text-sm text-green-700">Profit {peso(entry.profit)}</span>
                  <ActionForm
                    action={deleteFinanceEntry}
                    submitLabel="Delete"
                    variant="danger"
                    className="ml-auto flex items-center gap-2"
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
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
