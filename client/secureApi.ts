const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function apiCall(path: string, options?: RequestInit, accessToken?: string | null) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options?.headers || {}),
    },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}