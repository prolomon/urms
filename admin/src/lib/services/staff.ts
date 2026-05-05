import { API_URL, buildHeaders } from "../api";

export type Staff = {
  id?: string;
  uid?: string;
  fullname: string;
  email: string;
  phone: string;
  gender: string;
  status?: boolean;
  password?: string;
  location?: string;
  avatar?: string;
  center?: string;
  secureToken?: string;
  role?: "STAFF";
  createdAt?: Date;
  updatedAt?: Date;
}

export async function getStaffs(uid: string): Promise<{ ok: boolean; data?: Staff[]; message?: string, meta: { total: number; limit: number; page: number; totalPages: number } }> {
  if (!uid) {
    throw new Error("No user ID found");
  }
  const response = await fetch(`${API_URL}/staff/center/${uid}`, {
    headers: {...buildHeaders(false)},
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch staffs");
  }
  return data;
}

export async function getStaff(uid: string): Promise<{ ok: boolean; staff?: Staff; message?: string }> {
  if (!uid) {
    throw new Error("No user ID found");
  }
  const response = await fetch(`${API_URL}/staff/${uid}`, {
    headers: {...buildHeaders(false)},
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch staffs");
  }
  return data;
}

export type CreateStaffPayload = Omit<Staff, "id" | "uid" | "avatar"> & {
  avatar?: string | File;
};

export async function createStaff(payload: CreateStaffPayload): Promise<{ ok: boolean; staff?: Staff; message?: string }> {
  const avatarValue = payload?.avatar;
  const hasAvatarFile = typeof File !== "undefined" && (avatarValue as any) instanceof File;

  const response = await fetch(`${API_URL}/staff`, {
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
    throw new Error(data.message || "Failed to create staff");
  }
  return data;
}

export async function updateStaff(id: string, payload: Partial<Staff>): Promise<{ ok: boolean; staff?: Staff; message?: string }> {
  const response = await fetch(`${API_URL}/staff/${id}`, {
    method: "PUT",
    headers: {...buildHeaders(true)},
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update staff");
  }
  return data;
}

export async function deleteStaff(id: string): Promise<{ ok: boolean; message?: string }> {
  const response = await fetch(`${API_URL}/staff/${id}`, {
    method: "DELETE",
    headers: {...buildHeaders(true)},
  });
  const data = await response.json();
    if (!response.ok) {
    throw new Error(data.message || "Failed to delete staff");
    }
    return data;
}