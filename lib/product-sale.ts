import type { ProductSaleMode } from "@/types/product";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export interface ProductSaleWindow {
  saleMode: ProductSaleMode;
  saleStartAt: string | Date | null;
  saleEndAt: string | Date | null;
}

export type ProductSaleState = "always" | "upcoming" | "active" | "ended";

export interface ProductSaleStatus {
  state: ProductSaleState;
  canOrder: boolean;
  countdownTarget: string | null;
  countdownType: "start" | "end" | null;
  startsAt: string | null;
  endsAt: string | null;
}

function toDate(value: string | Date | null | undefined) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getKstParts(value: string | Date | null | undefined) {
  const date = toDate(value);

  if (!date) {
    return null;
  }
  const kstDate = new Date(date.getTime() + KST_OFFSET_MS);

  return {
    year: String(kstDate.getUTCFullYear()),
    month: String(kstDate.getUTCMonth() + 1).padStart(2, "0"),
    day: String(kstDate.getUTCDate()).padStart(2, "0"),
    hour: String(kstDate.getUTCHours()).padStart(2, "0"),
    minute: String(kstDate.getUTCMinutes()).padStart(2, "0"),
  };
}

export function parseKstDateTimeInput(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
  );

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute] = match;
  const utcTime =
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      0,
      0,
    ) - KST_OFFSET_MS;

  return new Date(utcTime).toISOString();
}

export function formatSaleDateTime(value: string | Date | null | undefined) {
  const date = toDate(value);

  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatSaleDateTimeInput(
  value: string | Date | null | undefined,
) {
  const parts = getKstParts(value);

  if (!parts) {
    return "";
  }

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function formatSalePeriod(
  startAt: string | Date | null | undefined,
  endAt: string | Date | null | undefined,
) {
  const startLabel = formatSaleDateTime(startAt);
  const endLabel = formatSaleDateTime(endAt);

  if (startLabel === "-" || endLabel === "-") {
    return "-";
  }

  return `${startLabel} ~ ${endLabel}`;
}

export function formatCountdown(remainingMs: number) {
  const safeMs = Math.max(0, remainingMs);
  const totalSeconds = Math.floor(safeMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${String(days).padStart(2, "0")}일 ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function getProductSaleStatus(
  saleWindow: ProductSaleWindow,
  now: Date = new Date(),
): ProductSaleStatus {
  if (saleWindow.saleMode === "always") {
    return {
      state: "always",
      canOrder: true,
      countdownTarget: null,
      countdownType: null,
      startsAt: null,
      endsAt: null,
    };
  }

  const startsAt = toDate(saleWindow.saleStartAt);
  const endsAt = toDate(saleWindow.saleEndAt);

  if (!startsAt || !endsAt) {
    return {
      state: "ended",
      canOrder: false,
      countdownTarget: null,
      countdownType: null,
      startsAt: null,
      endsAt: null,
    };
  }

  const nowTime = now.getTime();
  const startTime = startsAt.getTime();
  const endTime = endsAt.getTime();

  if (nowTime < startTime) {
    return {
      state: "upcoming",
      canOrder: false,
      countdownTarget: startsAt.toISOString(),
      countdownType: "start",
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    };
  }

  if (nowTime >= endTime) {
    return {
      state: "ended",
      canOrder: false,
      countdownTarget: null,
      countdownType: null,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    };
  }

  return {
    state: "active",
    canOrder: true,
    countdownTarget: endsAt.toISOString(),
    countdownType: "end",
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  };
}
