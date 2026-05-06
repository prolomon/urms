import { API_URL, buildHeaders } from "../api";

export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "QUARTERLY";

export type Member = {
  id?: string;
  uid?: string;
  fullname: string;
  businessName?: string;
  center?: string;
  email: string;
  phone: string;
  type: "BUSINESS" | "INDIVIDUAL";
  category: "";
  company?: string;
  billingFrequency?: Frequency;
  password?: string;
  location?: {
    state: string;
    city: string;
    address: string;
    zipcode: string;
    nearestBusStop: string;
  };
  status?: boolean;
  avatar?: string;
  secureToken?: string;
  pricing?: string[];
  role?: "USER" | "ADMIN";
  createdAt?: string;
  updatedAt?: string;
  agent?: string;
};

export async function getMembers( page: number, limit: number, id: string, ): Promise<{ data: Member[]; ok: boolean; message?: string; meta: { total: number; page: number; limit: number; totalPages: number };
}> {
  const response = await fetch(`${API_URL}/member/${id}/center?page=${page}&limit=${limit}`, { headers: { ...buildHeaders() } }, );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch members");
  }
  return data;
}

export async function createMember(
  payload: Member,
): Promise<{ data?: Member; member?: Member; ok: boolean; message?: string }> {
  const response = await fetch(`${API_URL}/member`, {
    method: "POST",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create member");
  }
  return data;
}

export async function getMember(
  id: string,
): Promise<{ data: Member; ok: boolean; message?: string }> {
  const response = await fetch(`${API_URL}/member/${id}`, {
    headers: { ...buildHeaders() },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch member");
  }
  return data;
}

export async function deleteMember(
  id: string,
): Promise<{ message: string; ok: boolean }> {
  const response = await fetch(`${API_URL}/member/${id}`, {
    method: "DELETE",
    headers: { ...buildHeaders() },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to delete member");
  }
  return data;
}

export async function updateMember(
  id: string,
  payload: Partial<Member>,
): Promise<{ message: string; ok: boolean; member: Member }> {
  const response = await fetch(`${API_URL}/member/${id}`, {
    method: "PUT",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update member");
  }
  return data;
}

export async function paymentAction(
  id: string,
  ids: string[],
  action: string,
): Promise<{ message: string; ok: boolean; member: Member }> {
  const response = await fetch(`${API_URL}/member/${id}/pricing-action`, {
    method: "PUT",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify({ ids, action }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update member");
  }
  return data;
}

export async function getMembersByAgentId(
  page: number,
  limit: number,
  id: string,
): Promise<{
  data: Member[];
  ok: boolean;
  message?: string;
  meta: { total: number; page: number; limit: number; totalPages: number };
}> {
  const response = await fetch(
    `${API_URL}/member/agent/${id}?page=${page}&limit=${limit}`,
    { headers: { ...buildHeaders() } },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch members");
  }
  return data;
}

export async function getMembersByCompanyId(
  page: number,
  limit: number,
  id: string,
): Promise<{
  data: Member[];
  ok: boolean;
  message?: string;
  meta: { total: number; page: number; limit: number; totalPages: number };
}> {
  const response = await fetch(
    `${API_URL}/member/company/${id}?page=${page}&limit=${limit}`,
    { headers: { ...buildHeaders() } },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch members");
  }
  return data;
}

export async function getMembersByPricingId(
  page: number,
  limit: number,
  id: string,
): Promise<{
  data: Member[];
  ok: boolean;
  message?: string;
  meta: { total: number; page: number; limit: number; totalPages: number };
}> {
  const response = await fetch(
    `${API_URL}/member/pricing/${id}?page=${page}&limit=${limit}`,
    { headers: { ...buildHeaders() } },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch members");
  }
  return data;
}

export async function changeAgent(
  userId: string,
  agentId: string,
): Promise<{ message: string; ok: boolean; member: Member }> {
  const response = await fetch(`${API_URL}/member/change-agent`, {
    method: "PUT",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify({ userId, agentId }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update member");
  }
  return data;
}
export async function changeCompany(
  userId: string,
  companyId: string,
): Promise<{ message: string; ok: boolean; member: Member }> {
  const response = await fetch(`${API_URL}/member/change-company`, {
    method: "PUT",
    headers: { ...buildHeaders(true) },
    body: JSON.stringify({ userId, companyId }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update member");
  }
  return data;
}
