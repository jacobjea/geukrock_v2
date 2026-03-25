"use client";

import { useFormStatus } from "react-dom";

interface OrderActionSubmitButtonProps {
  idleLabel: string;
  pendingLabel: string;
  disabled?: boolean;
  tone?: "neutral" | "danger";
}

export function OrderActionSubmitButton({
  idleLabel,
  pendingLabel,
  disabled = false,
  tone = "neutral",
}: OrderActionSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;
  const className =
    tone === "danger"
      ? "inline-flex w-full items-center justify-center gap-2 rounded border border-[#e5c5c5] bg-[#fff6f6] px-3 py-2 text-xs font-medium text-[#a13c3c] hover:bg-[#ffeaea] disabled:cursor-not-allowed disabled:border-[#e5e7eb] disabled:bg-[#f3f4f6] disabled:text-[#9ca3af]"
      : "inline-flex w-full items-center justify-center gap-2 rounded border border-[#d9dde3] bg-white px-3 py-2 text-xs font-medium text-[#374151] hover:bg-[#f7f8fa] disabled:cursor-not-allowed disabled:bg-[#f3f4f6] disabled:text-[#9ca3af]";

  return (
    <button type="submit" disabled={isDisabled} className={className}>
      {pending ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {pendingLabel}
        </>
      ) : (
        idleLabel
      )}
    </button>
  );
}
