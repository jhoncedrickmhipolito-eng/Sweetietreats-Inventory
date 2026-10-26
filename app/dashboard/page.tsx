import { prisma } from "@/lib/db";

// Always render fresh from the database (no static prerender).
export const instant = false;

const peso = (n: number) =>
  n.toLocaleString("en-PH", { style: "currency", currency: "PHP" });

function isToday(d: Date) {
  return new Date(d).toDateString() === new Date().toDateString();
}

function StatCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "pink" | "green" | "red" | "blue" | "amber";
}) {
  const tones = {
    neutral: "bg-gray-100 text-gray-800",
    pink: "bg-pink-100 text-pink-800",
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    blue: "bg-blue-50 text-blue-800",
    amber: "bg-amber-100 text-amber-800",
  } as const;
  return (
    <div className={`rounded-xl p-4 ${tones[tone]}`}>
      <div className="text-xs font-medium opacity-75">{label}</div>
      <div className="mt-1 text-xl font-extrabold">{value}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const [entries, expenses, uses, products] = await Promise.all([
    prisma.financeEntry.findMany(),
    prisma.expense.findMany(),
    prisma.ingredientUse.findMany(),
    prisma.product.findMany(),
  ]);

  const totals = entries.reduce(
    (acc, e) => ({
      income: acc.income + e.income,
      capital: acc.capital + e.capital,
      profit: acc.profit + e.profit,
    }),
    { income: 0, capital: 0, profit: 0 },
  );

  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const expenseToday = expenses.filter((e) => isToday(e.createdAt)).reduce((s, e) => s + e.amount, 0);
  const ingredientTotal = uses.reduce((s, u) => s + u.cost, 0);
  const ingredientToday = uses.filter((u) => isToday(u.createdAt)).reduce((s, u) => s + u.cost, 0);
  const stockValue = products.reduce((s, p) => s + p.price * p.quantity, 0);
  const stockItems = products.reduce((s, p) => s + p.quantity, 0);

  // Money left = profit earned, minus everything spent on expenses and ingredients.
  const moneyLeft = totals.profit - expenseTotal - ingredientTotal;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-[#3d1a10]">Business Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          A summary of everything recorded in the app.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard label="Total Income" value={peso(totals.income)} tone="pink" />
          <StatCard label="Total Capital" value={peso(totals.capital)} tone="blue" />
          <StatCard label="Total Profit" value={peso(totals.profit)} tone="green" />
          <StatCard label="Expenses (all time)" value={peso(expenseTotal)} tone="red" />
          <StatCard label="Expenses (today)" value={peso(expenseToday)} tone="red" />
          <StatCard label="Ingredient cost (all time)" value={peso(ingredientTotal)} tone="amber" />
          <StatCard label="Ingredient cost (today)" value={peso(ingredientToday)} tone="amber" />
          <StatCard label={`Stock value (${stockItems} items)`} value={peso(stockValue)} tone="blue" />
          <StatCard
            label="Money left"
            value={peso(moneyLeft)}
            tone={moneyLeft < 0 ? "red" : "green"}
          />
        </div>

        <p className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
          <strong>Money left</strong> = total profit − all-time expenses − all-time ingredient
          costs. Stock value is separate: it is what your remaining products are worth, not
          cash.
        </p>
      </section>

      <section className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[#3d1a10]">Activity at a glance</h2>
        <ul className="mt-3 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
          <li className="rounded-lg bg-pink-50 p-3">
            <strong>{entries.length}</strong> money {entries.length === 1 ? "entry" : "entries"} recorded
          </li>
          <li className="rounded-lg bg-red-50 p-3">
            <strong>{expenses.length}</strong> {expenses.length === 1 ? "expense" : "expenses"} recorded
          </li>
          <li className="rounded-lg bg-amber-50 p-3">
            <strong>{uses.length}</strong> ingredient {uses.length === 1 ? "use" : "uses"} recorded
          </li>
          <li className="rounded-lg bg-blue-50 p-3">
            <strong>{products.length}</strong> {products.length === 1 ? "product" : "products"} in stock
          </li>
        </ul>
      </section>
    </div>
  );
}
