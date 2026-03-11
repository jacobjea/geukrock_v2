"use client";

import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
  idleLabel: string;
  pendingLabel: string;
}

export function SubmitButton({
  idleLabel,
  pendingLabel,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex min-w-32 items-center justify-center rounded border border-[#2f6fed] bg-[#2f6fed] px-4 py-2 text-sm font-medium text-white hover:bg-[#255fce] disabled:cursor-not-allowed disabled:opacity-55"
      disabled={pending}
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
