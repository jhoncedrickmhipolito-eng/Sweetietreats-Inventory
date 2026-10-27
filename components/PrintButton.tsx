"use client";

// Opens the browser's print dialog — prints the report currently on screen
// (site navigation, buttons, and inputs are hidden by the print stylesheet).
export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full bg-gray-200 px-4 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-300"
    >
      🖨 Print
    </button>
  );
}
