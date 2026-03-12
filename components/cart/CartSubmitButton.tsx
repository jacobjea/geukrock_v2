"use client";

import type { ComponentPropsWithoutRef } from "react";
import { useFormStatus } from "react-dom";

interface CartSubmitButtonProps
  extends Omit<ComponentPropsWithoutRef<"button">, "children" | "type"> {
  idleLabel: string;
  pendingLabel?: string;
}

export function CartSubmitButton({
  idleLabel,
  pendingLabel,
  className,
  disabled,
  ...props
}: CartSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={className}
      disabled={disabled || pending}
      {...props}
    >
      {pending ? pendingLabel ?? idleLabel : idleLabel}
    </button>
  );
}
