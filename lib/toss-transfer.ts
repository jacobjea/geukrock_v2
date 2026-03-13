import "server-only";

export interface TossRecipientInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export function getTossRecipientInfo(): TossRecipientInfo | null {
  const bank = process.env.TOSS_RECIPIENT_BANK?.trim();
  const accountNumber = process.env.TOSS_RECIPIENT_ACCOUNT_NUMBER?.trim();

  if (!bank || !accountNumber) {
    return null;
  }

  return {
    bankName: bank,
    accountNumber,
    accountHolder:
      process.env.TOSS_RECIPIENT_ACCOUNT_NAME?.trim() || "예금주 정보를 설정해 주세요",
  };
}

export function buildTossSendUrl(amount: number) {
  const recipientInfo = getTossRecipientInfo();
  const normalizedAmount = Math.floor(amount);

  if (!recipientInfo) {
    return null;
  }

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    return null;
  }

  const searchParams = new URLSearchParams({
    bank: recipientInfo.bankName,
    accountNo: recipientInfo.accountNumber,
    amount: String(normalizedAmount),
  });

  return `supertoss://send?${searchParams.toString()}`;
}
