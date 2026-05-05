import { API_URL, buildHeaders } from "../api";

export type Agent = {
  id?: string;
  uid?: string;
  name?: string;
  fullname: string;
  email: string;
  phone: string;
  gender: string;
  status?: boolean;
  password?: string;
  location?: string;
  avatar?: string;
  center?: string;
  company: string;
  batchNo: string;
  zone?: string;
  secureToken?: string;
  role?: "AGENT";
  createdAt?: Date;
  updatedAt?: Date;
}

export async function getAgents(uid: string): Promise<{ ok: boolean; data?: Agent[]; message?: string, meta: { total: number; limit: number; page: number; totalPages: number } }> {
  if (!uid) {
    throw new Error("No user ID found");
  }
  const response = await fetch(`${API_URL}/agent/company/${uid}`, {
    headers: {...buildHeaders(false)},
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch agents");
  }
  return data;
}

export async function getAgent(uid: string): Promise<{ ok: boolean; agent?: Agent; message?: string }> {
  if (!uid) {
    throw new Error("No user ID found");
  }
  const response = await fetch(`${API_URL}/agent/one/${uid}`, {
    headers: {...buildHeaders(false)},
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch agents");
  }
  return data;
}

export type CreateAgentPayload = Omit<Agent, "id" | "uid">;

export async function createAgent(payload: CreateAgentPayload): Promise<{ ok: boolean; agent?: Agent; message?: string }> {

  const response = await fetch(`${API_URL}/agent`, {
    method: "POST",
    headers: {...buildHeaders(true)},
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create agent");
  }
  return data;
}

export async function updateAgent(id: string, payload: Partial<Agent>): Promise<{ ok: boolean; agent?: Agent; message?: string }> {
  const response = await fetch(`${API_URL}/agent/${id}`, {
    method: "PUT",
    headers: {...buildHeaders(true)},
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update agent");
  }
  return data;
}

export async function deleteAgent(uid: string): Promise<{ ok: boolean; message: string }> {
  if (!uid) {
    throw new Error("No user ID found");
  }
  const response = await fetch(`${API_URL}/agent/${uid}`, {
    headers: {...buildHeaders(false)},
    method: "DELETE",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to delete agent");
  }
  return data;
}

