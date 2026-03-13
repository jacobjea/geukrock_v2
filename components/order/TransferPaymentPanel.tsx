"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";

import QRCode from "qrcode";

import { formatPrice } from "@/lib/admin/format";

interface TransferPaymentPanelProps {
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  orderCodes?: string[];
}

function CopyNoteIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 4.75h6.5L19.25 9.5V18A2.25 2.25 0 0 1 17 20.25H8A2.25 2.25 0 0 1 5.75 18V7A2.25 2.25 0 0 1 8 4.75Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M14.5 4.75V9.5h4.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="m9.25 15.75 4.9-4.9 1.6 1.6-4.9 4.9-2.35.75.75-2.35Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function AccountValueRow({
  value,
  copyable = false,
}: {
  value: string;
  copyable?: boolean;
}) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {}
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="break-all text-[15px] font-medium text-black">{value}</p>
      {copyable ? (
        <button
          type="button"
          onClick={handleCopy}
          aria-label="계좌번호 복사"
          title="복사"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/12 text-black/72 transition-colors duration-200 hover:bg-black/[0.03] hover:text-black"
        >
          <CopyNoteIcon className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

function getTossSendUrl(input: {
  amount: number;
  bankName: string;
  accountNumber: string;
}) {
  const normalizedAmount = Math.floor(input.amount);

  if (
    !input.bankName ||
    !input.accountNumber ||
    !Number.isFinite(normalizedAmount) ||
    normalizedAmount <= 0
  ) {
    return null;
  }

  const searchParams = new URLSearchParams({
    bank: input.bankName,
    accountNo: input.accountNumber,
    amount: String(normalizedAmount),
  });

  return `supertoss://send?${searchParams.toString()}`;
}

export function TransferPaymentPanel({
  amount,
  bankName,
  accountNumber,
  accountHolder,
  orderCodes = [],
}: TransferPaymentPanelProps) {
  const tossSendUrl = getTossSendUrl({
    amount,
    bankName,
    accountNumber,
  });
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function createQrCode() {
      if (!tossSendUrl) {
        setQrCodeUrl(null);
        return;
      }

      try {
        const nextQrCodeUrl = await QRCode.toDataURL(tossSendUrl, {
          errorCorrectionLevel: "M",
          margin: 1,
          width: 132,
          color: {
            dark: "#111111",
            light: "#FFFFFFFF",
          },
        });

        if (!cancelled) {
          setQrCodeUrl(nextQrCodeUrl);
        }
      } catch {
        if (!cancelled) {
          setQrCodeUrl(null);
        }
      }
    }

    void createQrCode();

    return () => {
      cancelled = true;
    };
  }, [tossSendUrl]);

  return (
    <div className="mt-4 space-y-4">
      {orderCodes.length > 0 ? (
        <div className="rounded-2xl border border-black/10 bg-[#faf9f6] px-4 py-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-black/46">
            Order Code
          </p>
          <div className="mt-2 space-y-1 text-[15px] font-medium text-black">
            {orderCodes.map((orderCode) => (
              <p key={orderCode}>{orderCode}</p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-[#d7e4ff] bg-[#f5f8ff] px-4 py-4">
        <p className="text-[13px] font-medium text-[#35558f]">입금 금액</p>
        <strong className="mt-2 block text-[1.5rem] font-semibold text-[#14396f]">
          {formatPrice(amount)}
        </strong>
      </div>

      <div className="rounded-2xl border border-black/10 bg-[#faf9f6] px-4 py-4">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_132px] sm:items-center">
          <div className="space-y-1">
            <AccountValueRow value={bankName} />
            <AccountValueRow value={accountNumber} copyable />
            <AccountValueRow value={accountHolder} />
          </div>

          {qrCodeUrl ? (
            <div className="mx-auto flex w-[132px] shrink-0 items-center justify-center rounded-xl border border-black/8 bg-white p-2 sm:mx-0 sm:justify-self-end">
              <img
                src={qrCodeUrl}
                alt="토스 송금 QR 코드"
                width={116}
                height={116}
                className="h-[116px] w-[116px]"
              />
            </div>
          ) : null}
        </div>
      </div>

      {tossSendUrl ? (
        <a
          href={tossSendUrl}
          className="inline-flex h-12 w-full items-center justify-center rounded bg-[#0064ff] text-[15px] font-medium text-white hover:bg-[#0056dc]"
        >
          Toss 송금하기
        </a>
      ) : null}

      <div className="space-y-2 text-[13px] leading-6 text-black/54">
        <p>
          송금을 완료해도 주문 상태는 즉시 변경되지 않으며, 관리자가 입금 내역을
          확인한 뒤 순차적으로 반영됩니다.
        </p>
        <p>
          데스크톱에서는 토스 앱 딥링크가 바로 열리지 않을 수 있습니다. 그 경우
          위 계좌 정보를 보고 직접 송금해 주세요.
        </p>
      </div>
    </div>
  );
}
