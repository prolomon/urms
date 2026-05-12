import { API_URL, buildHeaders } from "@/lib/api";
import { Transaction } from "../types";

export async function getTransactions(
  id: string,
  token: string,
  fromDate?: string,
  toDate?: string,
  query?: string
): Promise<{ ok: boolean; transactions?: Transaction[]; message?: string }> {
  const response = await fetch(`${API_URL}/transaction/user/${id}?fromDate=${fromDate}&toDate=${toDate}&query=${query}`, {
    method: "GET",
    headers: { ...buildHeaders(true, token) },
  });

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(errorData.message || "Failed to create admin");
  }
  const data = await response.json();
  return data;
}

export async function getTransaction(
  id: string,
  token: string
): Promise<{ ok: boolean; transaction?: Transaction; message?: string }> {
  const response = await fetch(`${API_URL}/transaction/${id}`, {
    method: "GET",
    headers: { ...buildHeaders(true, token) },
  });

  if (!response.ok) {
    const errorData = await response.json();

    throw new Error(errorData.message || "Failed to create admin");
  }
  const data = await response.json();
  return data;
}
