import { prisma } from "@/lib/db";
import ActionForm from "@/components/ActionForm";
import { addExpense, deleteExpense } from "@/lib/actions";

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

export default async function ExpensesPage() {
  const expenses = await prisma.expense.findMany({
    orderBy: { createdAt: "desc" },
  });

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const today = new Date().toDateString();
  const todayTotal = expenses
    .filter((e) => new Date(e.createdAt).toDateString() === today)
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border-2 border-pink-200 bg-white p-5 shadow-sm">
        <h1 className="text-lg font-semibold text-[#3d1a10]">Record Expense</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter how much you spent and what it was for.
        </p>
        <ActionForm
          action={addExpense}
          submitLabel="Save expense"
          className="mt-4 grid max-w-lg gap-3"
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
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-[#3d1a10]">Expenses History</h2>
          <div className="text-sm text-gray-600">
            Today: <strong className="text-[#e7549d]">{peso(todayTotal)}</strong>
            <span className="mx-2 text-gray-300">|</span>
            All time: <strong className="text-[#e7549d]">{peso(total)}</strong>
          </div>
        </div>

        {expenses.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No expenses recorded yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100">
            {expenses.map((expense) => (
              <li key={expense.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <span className="w-40 text-sm text-gray-500">
                  {formatDateTime(expense.createdAt)}
                </span>
                <span className="font-medium">{expense.description}</span>
                <span className="text-sm font-semibold text-red-700">
                  {peso(expense.amount)}
                </span>
                <ActionForm
                  action={deleteExpense}
                  submitLabel="Delete"
                  variant="danger"
                  className="ml-auto flex items-center gap-2"
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
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
