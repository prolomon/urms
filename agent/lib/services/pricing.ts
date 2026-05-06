import { API_URL, buildHeaders } from "../api";
import { Pricing } from "../types";

export async function getPricing(id: string, token: string): Promise<{ ok: boolean; data: Pricing[]; message?: string }> {
  const response = await fetch(
    `${API_URL}/pricing/${id}/all`,
    { headers: buildHeaders(true, token) },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch members");
  }
  return data;
}