import React, { useState, useEffect } from "react";
import { api, getUsuario } from "./api.js";

export default function AdminUsuarios() {
  const [users, setUsers] = useState(null);
  const [err, setErr] = useState("");
  const [crear, setCrear] = useState(false);

  const cargar = async () => {
    try { setUsers(await api.adminUsuarios()); }
    catch (e) { setErr(e.message); setUsers([]); }
  };
  useEffect(() => { cargar(); }, []);

  const resetPass = async (u) => {
    const nueva = prompt(`Nueva contraseña para "${u.usuario}" (4+ caracteres):`);
    if (!nueva) return;
    try { await api.adminResetPass(u._id, nueva); alert("Contraseña actualizada."); }
    catch (e) { alert(e.message); }
  };
  const toggleRol = async (u) => {
    const nuevo = u.rol === "admin" ? "normal" : "admin";
    if (!confirm(`¿Cambiar a "${u.usuario}" a rol ${nuevo}?`)) return;
    try { await api.adminRol(u._id, nuevo); cargar(); }
    catch (e) { alert(e.message); }
  };
  const borrar = async (u) => {
    if (!confirm(`¿Borrar a "${u.usuario}" y TODOS sus datos? No se puede deshacer.`)) return;
    try { await api.adminBorrar(u._id); cargar(); }
    catch (e) { alert(e.message); }
  };

  return (
    <section className="fin-section">
      <div className="fin-section-head">
        <h2>Usuarios</h2>
        <button className="fin-section-action" onClick={() => setCrear(true)}>+ Nuevo</button>
      </div>
      <p className="fin-sub">Gestionás cuentas y reseteás contraseñas. Las claves no se pueden ver, solo reemplazar.</p>
      {err && <div className="fin-err">{err}</div>}
      {users === null && <p className="fin-empty">cargando…</p>}
      {users && users.map((u) => {
        const yo = u.usuario === getUsuario();
        return (
          <div key={u._id} className="fin-admin-row">
            <div className="fin-admin-info">
              <b>{u.usuario}{yo ? " (vos)" : ""}</b>
              <span className={`fin-rol-pill ${u.rol}`}>{u.rol}</span>
            </div>
            <div className="fin-admin-actions">
              <button onClick={() => resetPass(u)} title="Resetear clave">🔑</button>
              {!yo && <button onClick={() => toggleRol(u)} title="Cambiar rol">{u.rol === "admin" ? "↓" : "↑"}</button>}
              {!yo && <button onClick={() => borrar(u)} title="Borrar" className="danger">🗑️</button>}
            </div>
          </div>
        );
      })}
      {crear && <CrearUsuario onClose={() => setCrear(false)} onCreado={() => { setCrear(false); cargar(); }} />}
    </section>
  );
}

function CrearUsuario({ onClose, onCreado }) {
  const [usuario, setUsuario] = useState("");
  const [pass, setPass] = useState("");
  const [rol, setRol] = useState("normal");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setErr("");
    setSaving(true);
    try { await api.adminCrear(usuario.trim(), pass, rol); onCreado(); }
    catch (e) { setErr(e.message); setSaving(false); }
  };

  return (
    <div className="fin-overlay" onClick={onClose}>
      <div className="fin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fin-grip" />
        <h3>Nuevo usuario</h3>
        <label>Usuario</label>
        <input autoCapitalize="none" value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="usuario" />
        <label>Contraseña inicial</label>
        <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="mínimo 4 caracteres" />
        <label>Rol</label>
        <div className="fin-seg sm">
          <button className={rol === "normal" ? "on" : ""} onClick={() => setRol("normal")}>Normal</button>
          <button className={rol === "admin" ? "on" : ""} onClick={() => setRol("admin")}>Admin</button>
        </div>
        {err && <div className="au-err" style={{ marginTop: 14 }}>{err}</div>}
        <div className="fin-modal-actions">
          <button className="ghost" onClick={onClose}>Cancelar</button>
          <button className="primary" onClick={submit} disabled={saving || !usuario.trim() || pass.length < 4}>
            {saving ? "Creando…" : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}
