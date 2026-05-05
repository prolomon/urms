import { API_URL, buildHeaders } from "@/lib/api";
import { Admin } from "./admin";

export type Wallet = {
  id: string;
  userId?: string;
  role: "MEMBER" | "ADMIN" | "AGENT" | "PARTNER" | "STAFF";
  balance?: number;
  accountNo?: string;
  createdAt?: Date;
  updatedAt?: Date;
  status?: boolean;
  accountName: string;
  currency: string;
  bank: {
    id: string;
    name: string;
  };
  identification?: "NIN" | "BVN";
  verify?: boolean;
};

export type Transaction = {
  id: string;
  status: string;
  amount: string;
  fixedCharge: string;
  source: string;
  type: string;
  customerBillerId: string;
  timeCreated: string;
  timeUpdated: string;
  posTid: string;
  posSerialNumber: string;
  walletCurrency: string;
  walletBalance: string;
  billingVendorReference: string;
  paymentVendorReference: string;
  userId: string;
  ktaSenderName: string;
  ktaSenderAccountNumber: string;
  ktaSenderBankCode: string;
  recipientAccountNumber: string;
  recipientAccountType: string;
  senderName: string;
  currency: string;
  bankCode: string;
  productId: string;
  isAgentTransaction: true;
  isInternational: boolean;
  customerCommission: string;
  recipientAccountName: string;
  sessionId: string;
  accountNumber: string;
  bankName: string;
  entryType: string;
  transactionCategory: string;
  narration: string;
  receiptTerminalId: string;
};

export async function createWallet(
  name: string,
  bvn: string,
  role: string,
  id: string,
): Promise<{ ok: boolean; admin?: Wallet; message?: string }> {
  const response = await fetch(`${API_URL}/wallet`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify({ name, bvn, role, id }),
  });

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(errorData.message || "Failed to create admin");
  }
  const data = await response.json();
  return data;
}

export async function getWallet(
  id: string,
  role: "MEMBER" | "ADMIN" | "AGENT" | "COMPANY" | "STAFF",
): Promise<{
  ok: boolean;
  wallet?: Wallet;
  message?: string;
  isExist?: boolean;
}> {
  const response = await fetch(`${API_URL}/wallet/${id}/${role}`, {
    headers: { ...buildHeaders(true) },
  });
  const data = await response.json();
  return data;
}

export async function initiateTransfer(
  amount: string,
  accountNumber: string,
  accountName: string,
  bankCode: string,
  merchantTxRef: string,
  senderName: string,
  narration: string,
) {
  const response = await fetch(`${API_URL}/wallet/transfer/initiate`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify({
      amount,
      accountNumber,
      accountName,
      bankCode,
      merchantTxRef,
      senderName,
      narration,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to initiate transfer");
  }
  const data = await response.json();
  return data;
}

export async function resolveBankAccount(
  accountNumber: string,
  bankCode: string,
): Promise<{ accountName: string; accountNumber: string }> {
  const response = await fetch(`${API_URL}/wallet/resolve-bank-account`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify({ accountNumber, bankCode }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to resolve bank account");
  }
  const data = await response.json();
  return data;
}

export async function getBanks() {
  const response = await fetch(`${API_URL}/banks`, {
    headers: { ...buildHeaders(true) },
  });
  const data = await response.json();
  return data;
}

export async function getTransactions(
  accountNumber: string,
  fromDate: string,
  toDate: string,
): Promise<{ ok: boolean; transactions?: Wallet; message?: string }> {
  const response = await fetch(`${API_URL}/wallet/transactions`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify({ accountNumber, fromDate, toDate }),
  });

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(errorData.message || "Failed to create admin");
  }
  const data = await response.json();
  return data;
}
