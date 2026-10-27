"use client";

import { usePathname } from "next/navigation";

type Props = {
  from: string;
  to: string;
};

export default function DateFilter({ from, to }: Props) {
  const pathname = usePathname();
  const active = Boolean(from || to);

  return (
    <form
      action={pathname}
      method="get"
      className="no-print flex flex-wrap items-end gap-2 text-sm"
    >
      <label className="grid gap-1 font-medium">
        From
        <input
          type="date"
          name="from"
          defaultValue={from}
          className="rounded border border-gray-300 px-2 py-1"
        />
      </label>
      <label className="grid gap-1 font-medium">
        To
        <input
          type="date"
          name="to"
          defaultValue={to}
          className="rounded border border-gray-300 px-2 py-1"
        />
      </label>
      <button
        type="submit"
        className="rounded-full bg-[#e7549d] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#d13f88]"
      >
        Apply
      </button>
      {active && (
        <a
          href={pathname}
          className="rounded-full bg-gray-200 px-4 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-300"
        >
          Clear
        </a>
      )}
    </form>
  );
}
