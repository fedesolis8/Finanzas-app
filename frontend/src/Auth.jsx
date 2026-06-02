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
    <div className="au-wrap">
      {/* fondo animado */}
      <div className="au-bg">
        <div className="au-orb au-orb1" />
        <div className="au-orb au-orb2" />
        <div className="au-orb au-orb3" />
        <div className="au-grain" />
      </div>

      <div className="au-card">
        <div className="au-brand">
          <div className="au-coin">
            <span className="au-coin-face">$</span>
          </div>
          <h1 className="au-title">
            <span style={{ animationDelay: ".05s" }}>F</span>
            <span style={{ animationDelay: ".10s" }}>i</span>
            <span style={{ animationDelay: ".15s" }}>n</span>
            <span style={{ animationDelay: ".20s" }}>a</span>
            <span style={{ animationDelay: ".25s" }}>n</span>
            <span style={{ animationDelay: ".30s" }}>z</span>
            <span style={{ animationDelay: ".35s" }}>a</span>
            <span style={{ animationDelay: ".40s" }}>s</span>
          </h1>
          <p className="au-tagline">Tu dinero, mes a mes</p>
        </div>

        <div className="au-form">
          <div className="au-field">
            <label>Usuario</label>
            <input
              autoCapitalize="none" autoCorrect="off" value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="tu usuario"
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          <div className="au-field">
            <label>Contraseña</label>
            <input
              type="password" value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          {err && <div className="au-err">{err}</div>}

          <button className="au-btn" onClick={submit} disabled={loading}>
            <span>{loading ? "Un momento…" : modo === "login" ? "Ingresar" : "Crear cuenta"}</span>
            {!loading && <span className="au-btn-arrow">→</span>}
          </button>

          <div className="au-switch">
            {modo === "login" ? "¿No tenés cuenta? " : "¿Ya tenés cuenta? "}
            <button onClick={() => { setModo(modo === "login" ? "registro" : "login"); setErr(""); }}>
              {modo === "login" ? "Registrate" : "Ingresá"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
