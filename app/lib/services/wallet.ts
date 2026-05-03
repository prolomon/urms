import { API_URL, buildHeaders } from "@/lib/api";
import { Wallet } from "../types";

export async function createWallet( customerCode: string, id: string, accountType: string, token: string ): Promise<{ ok: boolean; wallet?: Wallet; message?: string }> {
  const response = await fetch(`${API_URL}/wallet`, {
    method: "POST",
    headers: { ...buildHeaders(true, token) },
    body: JSON.stringify({ customerCode, id, accountType }),
  });

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(errorData.message || "Failed to create wallet");
  }
  const data = await response.json();
  return data;
}

export const getWallet = async ( id: string, token: string ): Promise<{wallet: Wallet | null, isExist: boolean, ok: boolean, message: string}> => {
  try {
    if (!id) return { wallet: null, isExist: false, ok: false, message: "Invalid wallet ID" };

    const response = await fetch(`${API_URL}/wallet/agent/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { wallet: null, isExist: false, ok: false, message: "Failed to fetch wallet" };
    }

    const data = await response.json();

    return data || { wallet: null, isExist: false, ok: false, message: "Wallet not found" };
  } catch (e: any) {
    return { wallet: null, isExist: false, ok: false, message: e?.message || "Failed to fetch wallet" };
  }
};

export async function validateWallet( bvn: string, customerCode: string, type: "NIN" | "BVN" | "RC" | "TIN", token: string, id: string ) {
  const response = await fetch(`${API_URL}/wallet/${id}/validate-ownership`, {
    method: "POST",
    headers: { ...buildHeaders(true, token) },
    body: JSON.stringify({ customerCode, bvn, type }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to validate wallet");
  }

  const data = await response.json();
  return data;
}

export async function initiateTransfer(
  amount: number,
  recipientCode: string,
  reason: string,
  token?: string
) {
  const response = await fetch(`${API_URL}/wallet/transfer/initiate`, {
    method: "POST",
    headers: { ...buildHeaders(true, token) },
    body: JSON.stringify({ amount, recipientCode, reason }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to initiate transfer");
  }
  const data = await response.json();
  return data;
}

export async function createRecipient(
  name: string,
  accountNumber: string,
  bankCode: string,
  token?: string
) {
  const response = await fetch(`${API_URL}/wallet/transfer/recipient`, {
    method: "POST",
    headers: { ...buildHeaders(true, token) },
    body: JSON.stringify({ name, accountNumber, bankCode }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to create recipient");
  }

  const data = await response.json();
  return data;
}

export async function resolveBankAccount(accountNumber: string, bankCode: string, token?: string) {
  const response = await fetch(`${API_URL}/wallet/resolve-bank-account`, {
    method: "POST",
    headers: { ...buildHeaders(true, token) },
    body: JSON.stringify({ accountNumber, bankCode }),
  });

    if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to resolve bank account");
  }
  const data = await response.json();
  return data;
}

