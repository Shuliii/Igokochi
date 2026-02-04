const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function forceLogout() {
  localStorage.removeItem("igokochi_token");
  localStorage.removeItem("igokochi_isLoggedIn");
  localStorage.removeItem("igokochi_profile");
  window.location.href = "/admin/login";
}

function authHeaders() {
  const token = localStorage.getItem("igokochi_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function apiGet(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (res.status === 401 || res.status === 403) {
    forceLogout();
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json();
}

export async function apiPatch(path, body) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  if (res.status === 401 || res.status === 403) {
    forceLogout();
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json().catch(() => ({}));
}
