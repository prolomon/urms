import { API_URL, buildHeaders } from "@/lib/api";
import { Wallet, } from "../types";

export async function createWallet(
  name: string,
  bvn: string,
  role: string,
  id: string,
  token: string,
): Promise<{ ok: boolean; admin?: Wallet; message?: string }> {
  const response = await fetch(`${API_URL}/wallet`, {
    method: "POST",
    headers: { ...buildHeaders(true, token  ) },
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
  token: string,
): Promise<{
  ok: boolean;
  wallet?: Wallet;
  message?: string;
  isExist?: boolean;
}> {
  const response = await fetch(`${API_URL}/wallet/${id}/${role}`, {
    headers: { ...buildHeaders(true, token  ) },
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
  token: string
) {
  const response = await fetch(`${API_URL}/wallet/transfer/initiate`, {
    method: "POST",
    headers: { ...buildHeaders(true, token  ) },
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
  token: string
): Promise<{ accountName: string; accountNumber: string }> {
  const response = await fetch(`${API_URL}/wallet/resolve-bank-account`, {
    method: "POST",
    headers: { ...buildHeaders(true, token  ) },
    body: JSON.stringify({ accountNumber, bankCode }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to resolve bank account");
  }
  const data = await response.json();
  return data;
}

export async function getBanks(token: string): Promise<{ ok: boolean; banks?: { name: string; code: string }[]; message?: string }> {
  const response = await fetch(`${API_URL}/banks`, {
    headers: { ...buildHeaders(true, token  ) },
  });
  const data = await response.json();
  return data;
}

export async function getTransactions(
  accountNumber: string,
  fromDate: string,
  toDate: string,
  token: string
): Promise<{ ok: boolean; transactions?: Wallet; message?: string }> {
  const response = await fetch(`${API_URL}/wallet/transactions`, {
    method: "POST",
    headers: { ...buildHeaders(true, token ) },
    body: JSON.stringify({ accountNumber, fromDate, toDate }),
  });

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(errorData.message || "Failed to create admin");
  }
  const data = await response.json();
  return data;
}

