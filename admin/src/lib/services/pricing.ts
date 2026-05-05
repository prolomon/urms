import { API_URL, buildHeaders, getTokenFromCookie } from "../api";

export type Pricing = {
  status?: boolean;
  id?: string;
  title: string;
  price: string;
  category: string;
  type: string;
  benefit: string;
  center?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function createPricing(payload: Partial<Pricing>, uid: string): Promise<{ ok: boolean; pricing?: Pricing; message?: string }> {
  const response = await fetch(`${API_URL}/pricing`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify({ ...payload, userId: uid }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create pricing");
  }
  return data;
}

export async function updatePricing(payload: Partial<Pricing>, id: string): Promise<{ ok: boolean; pricing?: Pricing; message?: string }> {
  const response = await fetch(`${API_URL}/pricing/${id}`, {
    method: "PUT",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update pricing");
  }
  return data;
}

export async function getPricing(center: string, page: number, limit: number, selectedType?: string, selectedCategory?: string): Promise<{ ok: boolean; pricing?: Pricing; message?: string; data?: Pricing[] }> {
  const token = getTokenFromCookie();
  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_URL}/pricing/${center}/all?page=${page}&limit=${limit}` + (selectedType ? `&type=${selectedType}` : "") + (selectedCategory ? `&category=${selectedCategory}` : ""), {
    method: "GET",
    headers: { ...buildHeaders() },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch pricing");
  }
  return data;
}

export async function getPricingByCenter(id: string): Promise<{ ok: boolean; data?: Pricing[]; message?: string }> {
  const token = getTokenFromCookie();
  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_URL}/pricing/${id}/all`, {
    method: "GET",
    headers: { ...buildHeaders() },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch pricing");
  }
  return data;
}

export async function getPricingById(id: string): Promise<{ ok: boolean; pricing: Pricing; message?: string }> {
  const token = getTokenFromCookie();
  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_URL}/pricing/${id}`, {
    method: "GET",
    headers: { ...buildHeaders() },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch pricing");
  }
  return data;
}

export async function togglePricing(id: string): Promise<{ ok: boolean; pricing?: Pricing; message?: string }> {
  const response = await fetch(`${API_URL}/pricing/${id}/toggle-status`, {
    method: "PUT",
    headers: { ...buildHeaders(true) }
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update pricing");
  }
  return data;
}

