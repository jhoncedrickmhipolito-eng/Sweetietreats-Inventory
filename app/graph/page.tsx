import { prisma } from "@/lib/db";
import PrintButton from "@/components/PrintButton";

// Always render fresh from the database (no static prerender).
export const instant = false;

const peso = (n: number) =>
  n.toLocaleString("en-PH", { style: "currency", currency: "PHP" });

type MonthRow = {
  key: string;
  label: string;
  income: number;
  profit: number;
  expenses: number;
  ingredient: number;
};

const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const SERIES = [
  { name: "Income", field: "income", color: "#e7549d" },
  { name: "Profit", field: "profit", color: "#16a34a" },
  { name: "Expenses", field: "expenses", color: "#dc2626" },
  { name: "Ingredient cost", field: "ingredient", color: "#d97706" },
] as const;

export default async function GraphPage() {
  const [entries, expenses, uses] = await Promise.all([
    prisma.financeEntry.findMany(),
    prisma.expense.findMany(),
    prisma.ingredientUse.findMany(),
  ]);

  // Last 12 calendar months (oldest → newest). "now" is computed only after
  // data access so Next.js can prerender the shell safely.
  const now = new Date();
  const months: MonthRow[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: monthKey(d),
      label: d.toLocaleString("en-PH", { month: "short", year: "2-digit" }),
      income: 0,
      profit: 0,
      expenses: 0,
      ingredient: 0,
    });
  }
  const byKey = new Map(months.map((m) => [m.key, m]));

  // Each record counts in the month of the date the user entered on it.
  for (const e of entries) {
    const m = byKey.get(monthKey(e.occurredAt));
    if (m) {
      m.income += e.income;
      m.profit += e.profit;
    }
  }
  for (const e of expenses) {
    const m = byKey.get(monthKey(e.occurredAt));
    if (m) m.expenses += e.amount;
  }
  for (const u of uses) {
    const m = byKey.get(monthKey(u.usedAt));
    if (m) m.ingredient += u.cost;
  }

  const current = months[months.length - 1];
  const max = Math.max(
    ...months.flatMap((m) => [m.income, m.profit, m.expenses, m.ingredient]),
    1,
  );

  const barHeight = (v: number) =>
    v > 0 ? `${Math.max(3, (v / max) * 100)}%` : "3px";

  return (
    <section className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-[#3d1a10]">
          Money Flow — Last 12 Months
        </h1>
        <PrintButton />
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Monthly totals, grouped by the date you entered on each record.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-pink-50 p-3">
          <div className="text-xs text-pink-700">Income ({current.label})</div>
          <div className="text-lg font-bold">{peso(current.income)}</div>
        </div>
        <div className="rounded-lg bg-green-50 p-3">
          <div className="text-xs text-green-700">Profit ({current.label})</div>
          <div className="text-lg font-bold">{peso(current.profit)}</div>
        </div>
        <div className="rounded-lg bg-red-50 p-3">
          <div className="text-xs text-red-700">Expenses ({current.label})</div>
          <div className="text-lg font-bold">{peso(current.expenses)}</div>
        </div>
        <div className="rounded-lg bg-amber-50 p-3">
          <div className="text-xs text-amber-700">
            Ingredient cost ({current.label})
          </div>
          <div className="text-lg font-bold">{peso(current.ingredient)}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
        {SERIES.map((s) => (
          <span key={s.name} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            {s.name}
          </span>
        ))}
      </div>

      <div className="no-print mt-4 flex h-56 items-end gap-1.5 sm:gap-2">
        {months.map((m) => (
          <div key={m.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-1 items-end justify-center gap-0.5">
              {SERIES.map((s) => (
                <div
                  key={s.name}
                  title={`${s.name} (${m.label}): ${peso(m[s.field])}`}
                  className="w-1/4 rounded-t-sm"
                  style={{
                    height: barHeight(m[s.field]),
                    backgroundColor: s.color,
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] leading-tight text-gray-500">
              {m.label}
            </span>
          </div>
        ))}
      </div>

      {/* Printout: the same figures as a plain table (chart omitted). */}
      <table className="print-only mt-4 w-full border-collapse text-sm">
        <thead>
          <tr>
            <th>Month</th>
            <th>Income</th>
            <th>Profit</th>
            <th>Expenses</th>
            <th>Ingredient cost</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.key}>
              <td>{m.label}</td>
              <td>{peso(m.income)}</td>
              <td>{peso(m.profit)}</td>
              <td>{peso(m.expenses)}</td>
              <td>{peso(m.ingredient)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="print-only mt-2 text-sm">
        Sweetie Treats — Monthly money flow report (last 12 months) · Printed{" "}
        {new Date().toLocaleString("en-PH", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </section>
  );
}
