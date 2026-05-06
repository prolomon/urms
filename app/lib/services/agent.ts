import { API_URL, buildHeaders } from "../api";
import { User } from "../types";

export async function getAgent(uid: string, token: string) {
  if (!uid) {
    throw new Error("No user ID found");
  }
  const response = await fetch(`${API_URL}/agent/one/${uid}`, {
    headers: buildHeaders(true, token),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch agents");
  }
  return data;
}
