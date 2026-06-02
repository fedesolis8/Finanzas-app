const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const TOKEN = import.meta.env.VITE_API_TOKEN || "";

const headers = {
  "Content-Type": "application/json",
  ...(TOKEN ? { "x-api-token": TOKEN } : {}),
};

async function req(path, opts = {}) {
  const r = await fetch(BASE + path, { ...opts, headers });
  if (!r.ok) throw new Error("API " + r.status);
  return r.status === 204 ? null : r.json();
}

export const api = {
  getMovs: () => req("/api/movimientos"),
  addMov: (m) => req("/api/movimientos", { method: "POST", body: JSON.stringify(m) }),
  bulkMovs: (arr) => req("/api/movimientos/bulk", { method: "POST", body: JSON.stringify(arr) }),
  delMov: (id) => req("/api/movimientos/" + id, { method: "DELETE" }),
  clearMovs: () => req("/api/movimientos", { method: "DELETE" }),
  getConfig: () => req("/api/config"),
  setConfig: (c) => req("/api/config", { method: "PUT", body: JSON.stringify(c) }),
};

// Cotización del dólar (blue) para autocompletar el tipo de cambio. Si falla, manual.
export async function getDolar() {
  try {
    const r = await fetch("https://dolarapi.com/v1/dolares/blue");
    const d = await r.json();
    return Math.round((d.compra + d.venta) / 2);
  } catch {
    return null;
  }
}
