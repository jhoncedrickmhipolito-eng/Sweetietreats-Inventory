"use client";

import { useEffect, useRef, useState } from "react";
import { updateProductStock } from "@/lib/actions";

type Props = {
  productId: number;
  initialQty: number;
};

// Quantity box that saves on its own: press Enter or click/tap away and the
// value is stored — no "Set stock" button needed.
export default function StockQtyInput({ productId, initialQty }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const lastSavedRef = useRef(initialQty);
  const pendingRef = useRef(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");

  async function save() {
    if (pendingRef.current) return;
    const form = formRef.current;
    if (!form) return;

    const input = form.elements.namedItem("quantity") as HTMLInputElement | null;
    if (!input) return;

    const raw = input.value.trim();
    const value = Number(raw);
    // Nothing entered, or the value didn't actually change → no server call.
    if (raw === "" || !Number.isInteger(value) || value < 0) return;
    if (value === lastSavedRef.current) return;

    pendingRef.current = true;
    setStatus("saving");
    setError("");
    try {
      const res = await updateProductStock(null, new FormData(form));
      if (res.ok) {
        lastSavedRef.current = value;
        setStatus("saved");
      } else {
        setStatus("idle");
        setError(res.message);
      }
    } catch {
      setStatus("idle");
      setError("Could not save. Please try again.");
    } finally {
      pendingRef.current = false;
    }
  }

  // Hide the "Saved" tick after a moment.
  useEffect(() => {
    if (status !== "saved") return;
    const t = setTimeout(() => setStatus("idle"), 2500);
    return () => clearTimeout(t);
  }, [status]);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="ml-auto flex items-center gap-2"
    >
      <input type="hidden" name="id" value={productId} />
      <input
        name="quantity"
        type="number"
        step="1"
        min="0"
        required
        defaultValue={initialQty}
        aria-label="Quantity in stock"
        // Clicking away finishes editing → runs normal form validation, then saves.
        onBlur={() => formRef.current?.requestSubmit()}
        className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
      />
      <span role="status" className="w-36 text-xs leading-tight">
        {status === "saving" && <span className="text-gray-500">Saving…</span>}
        {status === "saved" && (
          <span className="font-semibold text-green-700">✓ Saved</span>
        )}
        {error && <span className="text-red-600">{error}</span>}
      </span>
      {/* Invisible fallback so Enter/assistive tech always has a submit target. */}
      <button type="submit" className="sr-only">
        Save stock
      </button>
    </form>
  );
}
