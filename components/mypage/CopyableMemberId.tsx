"use client";

interface CopyableMemberIdProps {
  value: string;
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

export function CopyableMemberId({ value }: CopyableMemberIdProps) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {}
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <p className="break-all text-[14px] text-black/68">{value}</p>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="아이디 복사"
        title="복사"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/12 text-black/72 transition-colors duration-200 hover:bg-black/[0.03] hover:text-black"
      >
        <CopyNoteIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
