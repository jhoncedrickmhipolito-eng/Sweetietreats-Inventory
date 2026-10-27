"use client";

import { useActionState, useEffect, useRef } from "react";
import type { ActionResult } from "@/lib/actions";

type Props = {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  submitLabel: string;
  className?: string;
  variant?: "primary" | "danger";
};

export default function ActionForm({ action, children, submitLabel, className, variant = "primary" }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  const buttonClass =
    variant === "danger"
      ? "mt-3 rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
      : "mt-3 rounded-full bg-[#e7549d] px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#d13f88] disabled:opacity-50";

  return (
    <form
      ref={formRef}
      action={formAction}
      className={["no-print", className].filter(Boolean).join(" ")}
    >
      {children}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Saving…" : submitLabel}
      </button>
      {state && (
        <p
          className={`mt-2 text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}
          role="status"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
