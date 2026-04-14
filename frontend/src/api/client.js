// src/api/client.js
// Thin fetch wrapper that handles JWT auth, token refresh and errors.

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

function getTokens() {
  try {
    return {
      access: localStorage.getItem("mb_access"),
      refresh: localStorage.getItem("mb_refresh"),
    };
  } catch {
    return {};
  }
}

function saveTokens({ access, refresh }) {
  localStorage.setItem("mb_access", access);
  if (refresh) localStorage.setItem("mb_refresh", refresh);
}

function clearTokens() {
  localStorage.removeItem("mb_access");
  localStorage.removeItem("mb_refresh");
  localStorage.removeItem("mb_user");
}

let isRefreshing = false;
let refreshQueue = [];

async function refreshAccessToken() {
  const { refresh } = getTokens();
  if (!refresh) throw new Error("No refresh token");
  const res = await fetch(`${BASE}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) throw new Error("Refresh failed");
  const data = await res.json();
  saveTokens({ access: data.access, refresh: data.refresh || refresh });
  return data.access;
}

async function request(path, options = {}) {
  const { access } = getTokens();
  const headers = {
    "Content-Type": "application/json",
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  // Token expired → try refresh once
  if (res.status === 401) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject, path, options });
      });
    }
    isRefreshing = true;
    try {
      const newAccess = await refreshAccessToken();
      isRefreshing = false;
      // Retry queued requests
      refreshQueue.forEach(({ resolve, reject, path: p, options: o }) =>
        request(p, o).then(resolve).catch(reject)
      );
      refreshQueue = [];
      // Retry original
      return request(path, options);
    } catch {
      isRefreshing = false;
      clearTokens();
      window.location.href = "/";
      throw new Error("Session expired");
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    // DRF field errors come as { field: ["msg"] } — extract first message as fallback
    const fieldMsg = !err.detail
      ? Object.values(err).flat().find(v => typeof v === "string")
      : null;
    throw Object.assign(new Error(err.detail || fieldMsg || "Erro inesperado."), { data: err, status: res.status });
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: "DELETE" }),
};

export { saveTokens, clearTokens, getTokens };
