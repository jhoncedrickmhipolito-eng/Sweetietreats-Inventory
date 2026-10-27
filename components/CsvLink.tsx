// Download link that saves the current table as a CSV file.
// A plain link (the browser handles the download); hidden when printing.
export default function CsvLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="no-print rounded-full border border-gray-300 bg-white px-4 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
    >
      ⬇ CSV
    </a>
  );
}
