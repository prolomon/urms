import { API_URL, buildHeaders } from "../api";

export type Company = {
  id?: string;
  uid?: string;
  name: string;
  email: string;
  phone: string;
  status?: boolean;
  password?: string;
  location?: string;
  avatar?: string;
  center?: string;
  secureToken?: string;
  role?: "COMPANY";
  createdAt?: Date;
  updatedAt?: Date;
}

export async function getCompanies(uid: string): Promise<{ ok: boolean; data?: Company[]; message?: string, meta: { total: number; limit: number; page: number; totalPages: number } }> {
  if (!uid) {
    throw new Error("No user ID found");
  }
  const response = await fetch(`${API_URL}/company/center/${uid}`, {
    headers: {...buildHeaders(false)},
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch companies");
  }
  return data;
}

export async function getCompany(uid: string): Promise<{ ok: boolean; company?: Company; message?: string }> {
  if (!uid) {
    throw new Error("No user ID found");
  }
  const response = await fetch(`${API_URL}/company/${uid}`, {
    headers: {...buildHeaders(false)},
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch companies");
  }
  return data;
}

export type CreateCompanyPayload = Omit<Company, "id" | "uid" | "avatar"> & {
  avatar?: string | File;
};

export async function createCompany(payload: CreateCompanyPayload): Promise<{ ok: boolean; company?: Company; message?: string }> {
  const avatarValue = payload?.avatar;
  const hasAvatarFile = typeof File !== "undefined" && (avatarValue as any) instanceof File;

  const response = await fetch(`${API_URL}/company`, {
    method: "POST",
    headers: hasAvatarFile ? {...buildHeaders(false)} : {...buildHeaders(true)},
    body: hasAvatarFile
      ? (() => {
          const formData = new FormData();

          Object.entries(payload).forEach(([key, value]) => {
            if (value === undefined || value === null) return;

            if (value instanceof File) {
              formData.append(key, value);
              return;
            }

            formData.append(key, String(value));
          });

          return formData;
        })()
      : JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create company");
  }
  return data;
}

export async function updateCompany(id: string, payload: Partial<Company>): Promise<{ ok: boolean; company?: Company; message?: string }> {
  const response = await fetch(`${API_URL}/company/${id}`, {
    method: "PUT",
    headers: {...buildHeaders(true)},
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update company");
  }
  return data;
}

export async function deleteCompany(id: string): Promise<{ ok: boolean; message?: string }> {
  const response = await fetch(`${API_URL}/company/${id}`, {
    method: "DELETE",
    headers: {...buildHeaders(true)},
  });
  const data = await response.json();
    if (!response.ok) {
    throw new Error(data.message || "Failed to delete company");
    }
    return data;
}

export async function login( email: string, password: string ): Promise<{ ok: boolean; company?: Company; message?: string, token: string }> {
  const response = await fetch(`${API_URL}/company/login`, {
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

  // persist cookie client-side (server should also set cookie via Set-Cookie)
  if (typeof window !== "undefined" && data.company?.uid) {
    try {
      document.cookie = `arums_uid=${encodeURIComponent(data.company.uid)}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
    } catch (e) {
      console.warn("Failed to set cookie client-side", e);
    }
  }

  return data;
}

export async function changePassword(id: string, currentPassword: string, newPassword: string, confirmPassword: string): Promise<{ ok: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_URL}/company/${id}/change-password`, {
    method: "PUT",
    headers: {...buildHeaders(true)},
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
  });
  const data = await response.json();
  if(!response.ok) {
    throw new Error(data.message || "Failed to change password");
  }
  return data;
}

export async function changeSecurityToken(id: string, oldSecurityToken: string, newSecurityToken: string, confirmSecurityToken: string): Promise<{ ok: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_URL}/company/${id}/change-security-token`, {
    method: "PUT",
    headers: {...buildHeaders(true)},
    body: JSON.stringify({ oldSecurityToken, newSecurityToken, confirmSecurityToken })
  });
  const data = await response.json();
  if(!response.ok) {
    throw new Error(data.message || "Failed to change security Token");
  }
  return data;
} 

export async function createSecurityToken(id: string, securityToken: string, confirmSecurityToken: string): Promise<{ ok: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_URL}/company/${id}/security-token`, {
    method: "POST",
    headers: {...buildHeaders(true)},
    body: JSON.stringify({ securityToken, confirmSecurityToken })
  });
  const data = await response.json();
  if(!response.ok) {
    throw new Error(data.message || "Failed to change security Token");
  }
  return data;
}

export async function verifySecurityCode(id: string, secureToken: string, ) {
  if (!secureToken) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_URL}/company/${id}/verify-security-code`, {
    method: "POST",
    headers: {...buildHeaders(true)},
    body: JSON.stringify({ secureCode: secureToken }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to verify security code");
  }

  return data;
}

export async function forgetPassword(id: string): Promise<{ ok: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_URL}/company/${id}/forget-password`, {
    method: "PUT",
    headers: {...buildHeaders(true)},
  });
  const data = await response.json();
  if(!response.ok) {
    throw new Error(data.message || "Failed to change password");
  }
  return data;
}

export async function forgetSecureCode(id: string): Promise<{ ok: boolean; message?: string; error?: string }> {
  const response = await fetch(`${API_URL}/company/${id}/forget-secure-token`, {
    method: "PUT",
    headers: {...buildHeaders(true)},
  });
  const data = await response.json();
  if(!response.ok) {
    throw new Error(data.message || "Failed to change secure code");
  }
  return data;
}

