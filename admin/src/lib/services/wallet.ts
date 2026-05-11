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

export enum TransactionStatus {
  PENDING,
  SUCCESS,
  FAILED,
  REFUNDED,
  CANCELLED
}

export type Transaction = {
  id: string;
  reference: string;
  event: string;
  status: TransactionStatus;
  amount: number;
  currency: string;
  channel: string | null;
  gatewayResponse: string | null;
  customerEmail: string | null;
  paymentReference: string | null;
  userId: string | null;
  metadata: object | null;
  rawPayload: object | null;
  createdAt: Date;
  updatedAt: Date;
  payment: string;
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
  id: string,
  narration: string,
  pin: string,
  type: "ADMIN" | "AGENT" | "COMPANY" | "STAFF"
) {
  const response = await fetch(`${API_URL}/wallet/transfer/initiate`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify({
      amount,
      accountNumber,
      accountName,
      bankCode,
      id,
      narration,
      pin,
      type
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
  const response = await fetch(`${API_URL}/wallet/banks`, {
    headers: { ...buildHeaders(true) },
  });
  const data = await response.json();
  return data;
}

export async function getTransactions(id: string): Promise<{ ok: boolean; transactions?: Wallet; message?: string }> {
  const response = await fetch(`${API_URL}/transaction/user/${id}`, {
    method: "GET",
    headers: { ...buildHeaders(true) },
  });

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(errorData.message || "Failed to create admin");
  }
  const data = await response.json();
  return data;
}

export async function getTransaction(id: string): Promise<{ ok: boolean; transaction?: Wallet; message?: string }> {
  const response = await fetch(`${API_URL}/transaction/${id}`, {
    method: "GET",
    headers: { ...buildHeaders(true) },
  });

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(errorData.message || "Failed to create admin");
  }
  const data = await response.json();
  return data;
}
