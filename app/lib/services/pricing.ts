import { API_URL, buildHeaders } from "../api";
import { Pricing } from "../types";

export async function getPricing(page: number, limit: number, center: string, selectedType?: string, selectedCategory?: string, token?: string): Promise<{ data: Pricing[]; meta: { total: number; page: number; limit: number }; ok: boolean; message?: string }> {
  const response = await fetch(
    `${API_URL}/pricing/${center}/all?page=${page}&limit=${limit}` + (selectedType ? `&type=${selectedType}` : "") + (selectedCategory ? `&category=${selectedCategory}` : ""),
    { headers: buildHeaders(true, token) },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch members");
  }
  return data;
}

export async function getPricingByCenter(id: string, token: string): Promise<{ ok: boolean; data?: Pricing[]; message?: string }> {

  const response = await fetch(`${API_URL}/pricing/${id}/all`, {
    method: "GET",
    headers: { ...buildHeaders(true, token) },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch pricing");
  }
  return data;
}