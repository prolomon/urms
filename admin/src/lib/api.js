export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"; 

export function getTokenFromCookie() {
  if (typeof window === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + "arums_token" + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function buildHeaders(hasJson = true) {
  const headers = {};
  if (hasJson) headers["Content-Type"] = "application/json";
  const token = getTokenFromCookie();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function login(email, password) {
  const response = await fetch(`${API_URL}/admin/login`, {
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
  if (typeof window !== "undefined" && data.admin?.uid) {
    try {
      document.cookie = `arums_uid=${encodeURIComponent(data.admin.uid)}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
    } catch (e) {
      console.warn("Failed to set cookie client-side", e);
    }
  }

  return data;
}

export async function getMembers(page, limit) {
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

export async function getMember(id) {
  const response = await fetch(`${API_URL}/member/${id}`, {
    headers: buildHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch member");
  }
  return data;
}

export async function deleteMember(id) {
  const response = await fetch(`${API_URL}/member/${id}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to delete member");
  }
  return data;
}

export async function updateMember(id, payload) {
  const response = await fetch(`${API_URL}/member/${id}`, {
    method: "PUT",
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update member");
  }
  return data;
}

export async function getPayment(id) {
  const response = await fetch(`${API_URL}/payment/reference/${id}`, {
    headers: buildHeaders(false),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch payments");
  }
  return data;
}

export async function getPayments(userId) {
  const response = await fetch(`${API_URL}/payment/user/${userId}`, {
    headers: buildHeaders(false),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch payments");
  }
  return data;
}

export async function getAllPayments() {
  const response = await fetch(`${API_URL}/payment`, {
    headers: buildHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch payments");
  }
  return data;
}

export async function calculateDistribution(config, id) {
  const response = await fetch(`${API_URL}/payment-distribution/calculate`, {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify({ ...config, userId: id }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch payments");
  }
  return data;
}

export async function getAdmin(id) {
  if (!id) {
    throw new Error("No user ID found");
  }

  const response = await fetch(`${API_URL}/admin/${id}`, {
    headers: buildHeaders(false),
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    let errorMessage = "Failed to fetch admin data";

    if (contentType && contentType.includes("application/json")) {
      try {
        const data = await response.json();
        errorMessage = data.message || errorMessage;
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
    } else {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data;
}

export async function updateAdmin(payload, uid) {
  if (!uid) {
    throw new Error("No user ID found");
  }
  const response = await fetch(`${API_URL}/admin/${uid}`, {
    method: "PUT",
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update admin");
  }
  return data;
}

export async function updatePaymentConfig(payload) {
  const token = getTokenFromCookie();
  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_URL}/admin/${token}/payment-config`, {
    method: "PUT",
    headers: buildHeaders(true),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update payment configuration");
  }
  return data;
}

// Log out the current user: clear auth cookie and local flag
export function logout() {
  if (typeof document !== "undefined") {
    // expire auth cookie
    document.cookie = "arums_uid=; path=/; max-age=0; SameSite=Lax";
  }
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("loggedIn");
  }
}
