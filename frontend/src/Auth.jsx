import React, { useState } from "react";
import { api, setSession } from "./api.js";

export default function Auth({ onAuth }) {
  const [modo, setModo] = useState("login");
  const [usuario, setUsuario] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr("");
    if (!usuario.trim() || !pass) { setErr("Completá usuario y contraseña"); return; }
    setLoading(true);
    try {
      const fn = modo === "login" ? api.login : api.register;
      const r = await fn(usuario.trim(), pass);
      setSession(r.token, r.usuario, r.rol);
      onAuth(r.usuario);
    } catch (e) {
      setErr(e.message || "Algo falló");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fin-auth">
      <div className="fin-auth-brand">
        <div className="logo">💸</div>
        <h1>Finanzas</h1>
        <p>{modo === "login" ? "Ingresá a tu cuenta" : "Creá tu cuenta"}</p>
      </div>

      <label>Usuario</label>
      <input
        autoCapitalize="none" autoCorrect="off" value={usuario}
        onChange={(e) => setUsuario(e.target.value)}
        placeholder="tu usuario"
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />

      <label>Contraseña</label>
      <input
        type="password" value={pass}
        onChange={(e) => setPass(e.target.value)}
        placeholder="••••••••"
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />

      {err && <div className="fin-auth-err">{err}</div>}

      <button className="fin-auth-btn" onClick={submit} disabled={loading}>
        {loading ? "Un momento…" : modo === "login" ? "Ingresar" : "Crear cuenta"}
      </button>

      <div className="fin-auth-switch">
        {modo === "login" ? "¿No tenés cuenta? " : "¿Ya tenés cuenta? "}
        <button onClick={() => { setModo(modo === "login" ? "registro" : "login"); setErr(""); }}>
          {modo === "login" ? "Registrate" : "Ingresá"}
        </button>
      </div>
    </div>
  );
}
