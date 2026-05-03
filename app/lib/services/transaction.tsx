import { API_URL, buildHeaders } from "@/lib/api";
import { Transaction } from "../types";

export async function getTransactions(id: string): Promise<{ transactions: Transaction[];  ok: boolean; message?: string }> {
  const response = await fetch(
    `${API_URL}/transaction/user/${id}`,
    { headers: buildHeaders() },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch members");
  }
  return data;
}

export async function getTransaction(id: string): Promise<{ transactions: Transaction;  ok: boolean; message?: string }> {
  const response = await fetch(
    `${API_URL}/transaction/${id}`,
    { headers: buildHeaders() },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch members");
  }
  return data;
}