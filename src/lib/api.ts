const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });

  // Handle 204 No Content (successful delete)
  if (res.status === 204) {
    return { status: "success" };
  }

  const data = await res.json();

  if (res.status === 401) {
    const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (refreshRes.ok) {
      const retryRes = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        credentials: "include",
      });
      return retryRes.json();
    }

    // Refresh failed — redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return data;
  }

  // Surface backend error messages properly instead of silently returning
  if (!res.ok) {
    const message = data?.message || data?.error || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  get: (endpoint: string) => request(endpoint, { method: "GET" }),
  post: (endpoint: string, body?: unknown) =>
    request(endpoint, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: (endpoint: string, body?: unknown) =>
    request(endpoint, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  del: (endpoint: string) => request(endpoint, { method: "DELETE" }),
};
