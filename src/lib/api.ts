const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;

  const headers: any = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const res = await fetch(url, {
    ...options,
    headers,
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
        headers,
        credentials: "include",
      });
      return retryRes.json();
    }

    // Refresh failed with auth error — redirect to login
    if (refreshRes.status === 401 || refreshRes.status === 403 || refreshRes.status === 400) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
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
  get: (endpoint: string, options?: RequestInit) => request(endpoint, { method: "GET", ...options }),
  post: (endpoint: string, body?: unknown, options?: RequestInit) =>
    request(endpoint, { method: "POST", body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined), ...options }),
  put: (endpoint: string, body?: unknown, options?: RequestInit) =>
    request(endpoint, { method: "PUT", body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined), ...options }),
  del: (endpoint: string, options?: RequestInit) => request(endpoint, { method: "DELETE", ...options }),
};
