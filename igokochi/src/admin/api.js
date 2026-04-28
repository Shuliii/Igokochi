// src/admin/api.js

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const LS_TOKEN = "igokochi_token";
const LS_IS_LOGGED_IN = "igokochi_isLoggedIn";
const LS_PROFILE = "igokochi_profile";

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export function forceLogout() {
  localStorage.removeItem(LS_TOKEN);
  localStorage.removeItem(LS_IS_LOGGED_IN);
  localStorage.removeItem(LS_PROFILE);
}

function getAuthHeaders() {
  const token = localStorage.getItem(LS_TOKEN);

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(path, options = {}) {
  const res = await fetch(apiUrl(path), {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (res.status === 401 || res.status === 403) {
    forceLogout();

    const err = new Error("Session expired");
    err.code = "SESSION_EXPIRED";
    throw err;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json().catch(() => ({}));
}

export function apiGet(path) {
  return request(path, {
    method: "GET",
  });
}

export function apiPost(path, body) {
  return request(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function apiPatch(path, body) {
  return request(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
