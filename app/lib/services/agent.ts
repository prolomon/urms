import { API_URL, buildHeaders } from "../api";
import { User } from "../types";

export async function login( email: string, password: string): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
  token?: string;
  agent?: User;
}> {
  const response = await fetch(`${API_URL}/agent/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}

export async function forgetPassword( oldPassword: string, newPassword: string, confirmPassword: string, id: string, token: string ): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
  token?: string;
  agent?: User;
}> {
  const response = await fetch(`${API_URL}/agent/${id}/forgot-password`, {
    method: "PUT",
    headers: buildHeaders(true, token),
    body: JSON.stringify({ oldPassword, newPassword, confirmPassword}),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}

export async function resetPassword( id: string, token: string ): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
  token?: string;
  agent?: User;
}> {
  const response = await fetch(`${API_URL}/agent/${id}/reset-password`, {
    method: "PUT",
    headers: buildHeaders(true, token),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}

export async function getMembers(page: number, limit: number) {
  const response = await fetch(
    `${API_URL}/member?page=${page}&limit=${limit}`,
    { headers: buildHeaders() },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch members");
  }
  return data;
}

export async function getMember(id: string) {
  const response = await fetch(`${API_URL}/member/${id}`, {
    headers: buildHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch member");
  }
  return data;
}

export async function getPayment(id: string) {
  const response = await fetch(`${API_URL}/payment/reference/${id}`, {
    headers: buildHeaders(false),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch payments");
  }
  return data;
}

export async function getPayments(userId: string) {
  const response = await fetch(`${API_URL}/payment/user/${userId}`, {
    headers: buildHeaders(false),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch payments");
  }
  return data;
}

export async function getAgent(uid: string) {
  if (!uid) {
    throw new Error("No user ID found");
  }
  const response = await fetch(`${API_URL}/agent/one/${uid}`, {
    headers: buildHeaders(false),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch agents");
  }
  return data;
}

export async function updateAgent(id: string, payload: any) {
  const response = await fetch(`${API_URL}/agent/${id}`, {
    method: "PUT",
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update agent");
  }
  return data;
}

export async function getPricing(id: string, token: string) {
  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_URL}/pricing/${id}/all`, {
    method: "GET",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch pricing");
  }
  return data;
}

export async function createSecurityCode(id: string, secureToken: string, confirmSecureToken: string, token: string) {
  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_URL}/agent/${id}/security-token`, {
    method: "POST",
    headers: buildHeaders(true, token),
    body: JSON.stringify({ secureToken, confirmSecureToken }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create security code");
  }

  return data;
}

export async function resetSecurityCode(id: string, secureToken: string, confirmSecureToken: string, code: string, token: string) {
  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_URL}/agent/${id}/reset-security-token`, {
    method: "POST",
    headers: buildHeaders(true, token),
    body: JSON.stringify({ secureToken, confirmSecureToken, code }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create security code");
  }

  return data;
}

export async function forgetSecurityCode(id: string, oldSecureToken: string, newSecureToken: string, confirmSecureToken: string, token: string) {
  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_URL}/agent/${id}/change-security-token`, {
    method: "POST",
    headers: buildHeaders(true, token),
    body: JSON.stringify({ oldSecureToken, newSecureToken, confirmSecureToken }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create security code");
  }

  return data;
}

export async function verifySecurityCode(id: string, secureToken: string, token: string) {
  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_URL}/agent/${id}/verify-security-token`, {
    method: "POST",
    headers: buildHeaders(true, token),
    body: JSON.stringify({ secureCode: secureToken }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to verify security code");
  }

  return data;
}