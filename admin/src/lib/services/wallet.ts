import { API_URL, buildHeaders } from "@/lib/api";
import { Admin } from "./admin";

export type Wallet = {
  id: string;
  memberId?: string;
  adminId?: string;
  agentId?: string;
  balance?: number;
  accountNo?: string;
  createdAt?: Date;
  updatedAt?: Date;
  member?: any;
  admin?: Admin;
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

export async function createWallet(
  customerCode: string,
  id: string,
  accountType: string,
): Promise<{ ok: boolean; admin?: Wallet; message?: string }> {
  const response = await fetch(`${API_URL}/wallet`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify({ customerCode, id, accountType }),
  });

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(errorData.message || "Failed to create admin");
  }
  const data = await response.json();
  return data;
}

export async function getWallet( id: string, type: "member" | "admin" | "agent" ): Promise<{ ok: boolean; wallet?: Wallet; message?: string; isExist?: boolean;}> {
  const response = await fetch(`${API_URL}/wallet/${type}/${id}`, {
    headers: { ...buildHeaders(true) },
  });
  const data = await response.json();
  return data;
}

export async function updateStatus(
  id: string,
  status: boolean,
): Promise<{
  ok: boolean;
  admin?: Wallet;
  message?: string;
}> {
  const response = await fetch(`${API_URL}/admin/${id}/status`, {
    method: "PUT",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify({ status }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update status");
  }
  return data;
}

export async function validateWallet( bvn: string, customerCode: string, type: "NIN" | "BVN" | "RC" | "TIN", id: string ) {
  console.log("Validating wallet with:", { bvn, customerCode, type, id });
  const response = await fetch(`${API_URL}/wallet/${id}/validate-ownership`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify({ customerCode, bvn, type }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to validate wallet");
  }

  const data = await response.json();
  return data;
}

export async function initiateTransfer( amount: number, recipientCode: string, reason: string ) {
  const response = await fetch(`${API_URL}/wallet/transfer/initiate`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify({ amount, recipientCode, reason }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to initiate transfer");
  }
  const data = await response.json();
  return data;
}

export async function createRecipient( name: string, accountNumber: string, bankCode: string ) {
  const response = await fetch(`${API_URL}/wallet/transfer/recipient`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify({ name, accountNumber, bankCode }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to create recipient");
  }

  const data = await response.json();
  return data;
}

export async function resolveBankAccount(accountNumber: string, bankCode: string) {
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

