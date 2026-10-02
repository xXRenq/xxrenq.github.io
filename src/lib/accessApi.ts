export type Account = {
  id: string;
  email: string;
};

export type AccessKey = {
  id: string;
  tool_id: string;
  created_at: number;
  expires_at: number;
  status: "active" | "used" | "expired" | "revoked";
  used_at: number | null;
  uses: number;
  tool_requests: number;
  last_used_at: number | null;
  client_version: string | null;
};

export type IssuedKey = {
  key: string;
  keyId: string;
  toolId: string;
  createdAt: number;
  expiresAt: number;
  status: "active";
  uses: 0;
};

const API_URL = (
  import.meta.env.VITE_LICENSE_API_URL || "https://xxrenq-access-api.xxrenq.workers.dev"
).trim().replace(/\/+$/, "");
const MANAGEMENT_TOKEN_STORAGE_KEY = "xxrenq_key_management_v1";

type RequestOptions = {
  method?: "GET" | "POST" | "DELETE";
  token?: string;
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_URL) throw new Error("The key service is not configured yet.");

  const headers = new Headers();
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  if (options.token) headers.set("Authorization", `Bearer ${options.token}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new Error("The key service could not be reached. Try again shortly.");
  }

  const payload = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "The request could not be completed.");
  return payload as T;
}

export const accessApi = {
  isConfigured: Boolean(API_URL),
  getManagementToken() {
    return sessionStorage.getItem(MANAGEMENT_TOKEN_STORAGE_KEY);
  },
  saveManagementToken(token: string) {
    sessionStorage.setItem(MANAGEMENT_TOKEN_STORAGE_KEY, token);
  },
  clearManagementToken() {
    sessionStorage.removeItem(MANAGEMENT_TOKEN_STORAGE_KEY);
  },
  register(email: string, password: string) {
    return request<{ token: string; expiresAt: number; account: Account }>("/api/auth/register", {
      method: "POST",
      body: { email, password },
    });
  },
  login(email: string, password: string) {
    return request<{ token: string; expiresAt: number; account: Account }>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
  },
  logout(token: string) {
    return request<{ ok: true }>("/api/auth/logout", { method: "POST", token });
  },
  me(token: string) {
    return request<{ account: Account; expiresAt: number }>("/api/me", { token });
  },
  keys(token: string) {
    return request<{ keys: AccessKey[] }>("/api/keys", { token });
  },
  connectGenerator(code: string) {
    return request<{ token: string; expiresAt: number }>("/api/generator/connect", {
      method: "POST",
      body: { code },
    });
  },
  disconnectGenerator(token: string) {
    return request<{ ok: true }>("/api/generator/session", { method: "DELETE", token });
  },
  generateKey(token: string, toolId: string) {
    return request<IssuedKey>("/api/keys", { method: "POST", token, body: { toolId } });
  },
  revokeKey(token: string, keyId: string) {
    return request<{ ok: true }>(`/api/keys/${encodeURIComponent(keyId)}`, {
      method: "DELETE",
      token,
    });
  },
};