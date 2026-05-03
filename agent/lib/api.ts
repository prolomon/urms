export const API_URL=process.env.EXPO_PUBLIC_API_URL + "/api"

export const AUTH_AGENT = "urms_agent";
export const AUTH_AGENT_WALLET = "urms_agent_wallet";
export const AUTH_AGENT_WALLET_STATE = "urms_agent_wallet_state";
export const AUTH_AGENT_TOKEN = "urms_agent_token";


export function buildHeaders(
  hasJson: boolean = true,
  token?: string,
): Record<string, string> {
  const headers: Record<string, string> = {};
  if (hasJson) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

