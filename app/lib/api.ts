export const API_URL=process.env.EXPO_PUBLIC_API_URL + "/api"

export const AUTH_MEMBER = "urms_member";
export const AUTH_MEMBER_WALLET = "urms_member_wallet";
export const AUTH_MEMBER_WALLET_STATE = "urms_member_wallet_state";
export const AUTH_MEMBER_TOKEN = "urms_member_token";


export function buildHeaders(
  hasJson: boolean = true,
  token?: string,
): Record<string, string> {
  const headers: Record<string, string> = {};
  if (hasJson) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

