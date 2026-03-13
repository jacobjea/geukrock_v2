"use client";

import { useEffect, useState } from "react";

import { TransferPaymentPanel } from "@/components/order/TransferPaymentPanel";

interface OrderTransferButtonProps {
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

function CloseIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m7 7 10 10M17 7 7 17"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function OrderTransferButton({
  amount,
  bankName,
  accountNumber,
  accountHolder,
}: OrderTransferButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-9 items-center justify-center rounded border border-[#2f6fed]/15 bg-[#eef4ff] px-3 text-[13px] font-medium text-[#2f6fed] hover:bg-[#e3edff]"
      >
        송금하기
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/52 px-4 py-8"
          onClick={() => setIsOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="송금 안내"
            className="w-full max-w-[420px] border border-black/10 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-black/8 px-5 py-5">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-black/52">
                  Transfer Guide
                </p>
                <h3 className="mt-2 text-[1.35rem] font-semibold tracking-[-0.04em] text-black">
                  입금 정보 안내
                </h3>
                <p className="mt-2 text-[14px] leading-6 text-black/68">
                  아래 정보를 확인한 뒤 직접 송금하거나, 토스 앱으로 바로 이동해
                  입금을 진행할 수 있습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="모달 닫기"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 text-black/68 hover:bg-black/[0.03] hover:text-black"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-5">
              <TransferPaymentPanel
                amount={amount}
                bankName={bankName}
                accountNumber={accountNumber}
                accountHolder={accountHolder}
              />

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="mt-4 inline-flex h-12 w-full items-center justify-center rounded border border-black/12 bg-white text-[15px] font-medium text-black hover:bg-black/[0.03]"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
