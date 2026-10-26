"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/finance", label: "Money" },
  { href: "/stock", label: "Stock" },
  { href: "/expenses", label: "Expenses" },
  { href: "/ingredients", label: "Ingredients" },
  { href: "/password", label: "Security" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2 border-t border-pink-100 bg-white/70 px-4 py-3">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            pathname === tab.href
              ? "bg-[#e7549d] text-white shadow-sm"
              : "bg-pink-100 text-[#3d1a10] hover:bg-pink-200"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
