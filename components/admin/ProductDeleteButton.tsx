"use client";

import { useFormStatus } from "react-dom";

interface ProductDeleteButtonProps {
  action: () => Promise<void>;
}

function DeleteButtonInner() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex items-center rounded border border-[#d9534f] bg-white px-3 py-2 text-xs font-medium text-[#d9534f] hover:bg-[#fff5f5] disabled:cursor-not-allowed disabled:opacity-55"
      disabled={pending}
    >
      {pending ? "삭제 중" : "삭제"}
    </button>
  );
}

export function ProductDeleteButton({ action }: ProductDeleteButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm("이 상품을 삭제하시겠습니까?")) {
          event.preventDefault();
        }
      }}
    >
      <DeleteButtonInner />
    </form>
  );
}
