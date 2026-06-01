const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");

export async function fetchMenu() {
  const res = await fetch(`${API_BASE}/menu`);
  const data = await res.json();

  if (!res.ok || !data.ok) {
    throw new Error(data.message || "Failed to fetch menu");
  }

  return data.menu;
}
