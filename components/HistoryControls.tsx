// One GET form for the history tables: date range + search + sort.
// Plain (non-client) form — the browser submits it without any JavaScript.

export type SortOption = { value: string; label: string };

type Props = {
  action: string;
  from: string;
  to: string;
  q?: string;
  sort: string;
  sortOptions: SortOption[];
  searchPlaceholder?: string;
};

export default function HistoryControls({
  action,
  from,
  to,
  q = "",
  sort,
  sortOptions,
  searchPlaceholder,
}: Props) {
  const filtering = Boolean(from || to || q);

  return (
    <form
      action={action}
      method="get"
      className="no-print flex flex-wrap items-end gap-2 text-sm"
    >
      <label className="grid gap-0.5 text-xs text-gray-500">
        From
        <input
          type="date"
          name="from"
          defaultValue={from}
          className="rounded border border-gray-300 px-2 py-1.5"
        />
      </label>
      <label className="grid gap-0.5 text-xs text-gray-500">
        To
        <input
          type="date"
          name="to"
          defaultValue={to}
          className="rounded border border-gray-300 px-2 py-1.5"
        />
      </label>
      {searchPlaceholder && (
        <label className="grid gap-0.5 text-xs text-gray-500">
          Search
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder={searchPlaceholder}
            maxLength={100}
            className="rounded border border-gray-300 px-2 py-1.5"
          />
        </label>
      )}
      <label className="grid gap-0.5 text-xs text-gray-500">
        Sort by
        <select
          name="sort"
          defaultValue={sort}
          className="rounded border border-gray-300 px-2 py-1.5"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="rounded-full bg-[#e7549d] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#d13f88]"
      >
        Apply
      </button>
      {filtering && (
        <a
          href={action}
          className="rounded-full bg-gray-200 px-4 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-300"
        >
          Clear
        </a>
      )}
    </form>
  );
}
