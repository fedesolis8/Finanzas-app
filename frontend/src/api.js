const BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

let token = localStorage.getItem("fin_token") || null;
export const getUsuario = () => localStorage.getItem("fin_usuario") || "";
export const getRol = () => localStorage.getItem("fin_rol") || "normal";
export const isAdmin = () => getRol() === "admin";
export const isAuth = () => !!token;
export function setSession(t, usuario, rol = "normal") {
  token = t;
  localStorage.setItem("fin_token", t);
  localStorage.setItem("fin_usuario", usuario);
  localStorage.setItem("fin_rol", rol);
}
export function logout() {
  token = null;
  localStorage.removeItem("fin_token");
  localStorage.removeItem("fin_usuario");
  localStorage.removeItem("fin_rol");
}

async function req(path, opts = {}) {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (token) headers.Authorization = "Bearer " + token;
  const r = await fetch(BASE + path, { ...opts, headers });
  if (r.status === 401) { logout(); throw new Error("401"); }
  if (!r.ok) {
    let msg = "Error " + r.status;
    try { const j = await r.json(); if (j.error) msg = j.error; } catch {}
    throw new Error(msg);
  }
  return r.status === 204 ? null : r.json();
}

export const api = {
  register: (usuario, pass) => req("/api/auth/register", { method: "POST", body: JSON.stringify({ usuario, pass }) }),
  login: (usuario, pass) => req("/api/auth/login", { method: "POST", body: JSON.stringify({ usuario, pass }) }),

  getMovs: () => req("/api/movimientos"),
  addMov: (m) => req("/api/movimientos", { method: "POST", body: JSON.stringify(m) }),
  addCuotas: (c) => req("/api/movimientos/cuotas", { method: "POST", body: JSON.stringify(c) }),
  delMov: (id) => req("/api/movimientos/" + id, { method: "DELETE" }),
  delGrupo: (g) => req("/api/movimientos/grupo/" + g, { method: "DELETE" }),
  clearMovs: () => req("/api/movimientos", { method: "DELETE" }),

  getRecurrentes: () => req("/api/recurrentes"),
  addRecurrente: (r) => req("/api/recurrentes", { method: "POST", body: JSON.stringify(r) }),
  updRecurrente: (id, r) => req("/api/recurrentes/" + id, { method: "PUT", body: JSON.stringify(r) }),
  delRecurrente: (id) => req("/api/recurrentes/" + id, { method: "DELETE" }),

  getConfig: () => req("/api/config"),
  setConfig: (c) => req("/api/config", { method: "PUT", body: JSON.stringify(c) }),

  // admin
  adminUsuarios: () => req("/api/admin/usuarios"),
  adminCrear: (usuario, pass, rol) => req("/api/admin/usuarios", { method: "POST", body: JSON.stringify({ usuario, pass, rol }) }),
  adminResetPass: (id, pass) => req("/api/admin/usuarios/" + id + "/pass", { method: "PUT", body: JSON.stringify({ pass }) }),
  adminRol: (id, rol) => req("/api/admin/usuarios/" + id + "/rol", { method: "PUT", body: JSON.stringify({ rol }) }),
  adminBorrar: (id) => req("/api/admin/usuarios/" + id, { method: "DELETE" }),
};

// dólar blue para autocompletar el tc
export async function getDolar() {
  try {
    const r = await fetch("https://dolarapi.com/v1/dolares/blue");
    const d = await r.json();
    return Math.round((d.compra + d.venta) / 2);
  } catch { return null; }
}
