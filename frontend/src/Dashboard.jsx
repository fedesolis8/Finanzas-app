import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { api, logout, getUsuario, isAdmin } from "./api.js";
import { C } from "./styles.js";
import {
  fmt, fmtCompact, hoyMes, mesLabel, mesCorto, diaLabel, addMes, cmpMes,
  conv, factoresInflacion, recurrentesDelMes, rangoMeses,
} from "./helpers.js";
import AddModal from "./AddModal.jsx";
import AdminUsuarios from "./AdminUsuarios.jsx";

const icoCat = (cat = "") => {
  const c = cat.toLowerCase();
  if (c.includes("vivienda") || c.includes("alquiler")) return "🏠";
  if (c.includes("comida")) return "🍔";
  if (c.includes("servicio")) return "💡";
  if (c.includes("transporte")) return "🚗";
  if (c.includes("salud")) return "🩺";
  if (c.includes("ocio")) return "🎮";
  if (c.includes("educ")) return "📚";
  if (c.includes("deuda") || c.includes("cuota")) return "💳";
  if (c.includes("sueldo") || c.includes("ingreso")) return "💰";
  return "•";
};

export default function Dashboard({ onLogout }) {
  const [movs, setMovs] = useState(null);
  const [recs, setRecs] = useState([]);
  const [cfg, setCfg] = useState(null);
  const [display, setDisplay] = useState("ARS");
  const [real, setReal] = useState(false);
  const [mes, setMes] = useState(hoyMes());
  const [view, setView] = useState("mes"); // mes | evolucion | subs | config
  const [modal, setModal] = useState(false);
  const [menu, setMenu] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [m, r, c] = await Promise.all([api.getMovs(), api.getRecurrentes(), api.getConfig()]);
        setMovs(m); setRecs(r); setCfg(c); setDisplay(c.monedaDisplay || "ARS");
      } catch (e) {
        if (e.message === "401") return onLogout();
        setErr("No se pudo conectar con la API."); setMovs([]); setCfg({ inflacion: {}, tcDefault: 1000 });
      }
    })();
  }, [onLogout]);

  const addMov = useCallback(async (m) => { const n = await api.addMov(m); setMovs((p) => [...p, n]); }, []);
  const addCuotas = useCallback(async (c) => { const arr = await api.addCuotas(c); setMovs((p) => [...p, ...arr]); }, []);
  const addRecurrente = useCallback(async (r) => { const n = await api.addRecurrente(r); setRecs((p) => [n, ...p]); }, []);
  const delMov = useCallback(async (m) => {
    if (m.grupoId) {
      if (!confirm(`Esto borra las ${m.cuotaTotal} cuotas del grupo. ¿Seguro?`)) return;
      await api.delGrupo(m.grupoId);
      setMovs((p) => p.filter((x) => x.grupoId !== m.grupoId));
    } else {
      await api.delMov(m._id);
      setMovs((p) => p.filter((x) => x._id !== m._id));
    }
  }, []);
  const darBaja = useCallback(async (rec) => {
    const mesBaja = hoyMes();
    const upd = await api.updRecurrente(rec._id, { mesBaja });
    setRecs((p) => p.map((x) => (x._id === rec._id ? upd : x)));
  }, []);
  const borrarSub = useCallback(async (rec) => {
    if (!confirm("¿Eliminar la suscripción por completo? (saca también su historial proyectado)")) return;
    await api.delRecurrente(rec._id);
    setRecs((p) => p.filter((x) => x._id !== rec._id));
  }, []);
  const guardarCfg = useCallback(async (parcial) => {
    const next = { ...cfg, ...parcial }; setCfg(next);
    try { await api.setConfig(next); } catch {}
  }, [cfg]);
  const limpiar = async () => {
    if (!confirm("¿Borrar TODOS los movimientos? (las suscripciones quedan)")) return;
    await api.clearMovs(); setMovs([]); setMenu(false);
  };

  const meses = useMemo(() => (movs ? rangoMeses(movs, recs) : []), [movs, recs]);
  const factores = useMemo(() => factoresInflacion(meses, cfg?.inflacion || {}), [meses, cfg]);

  // movimientos del mes = reales + suscripciones proyectadas
  const movsMes = useMemo(() => {
    if (!movs) return [];
    const reales = movs.filter((m) => m.mes === mes);
    return [...reales, ...recurrentesDelMes(recs, mes)];
  }, [movs, recs, mes]);

  const valor = useCallback((mov) => {
    let v = conv(mov, display);
    if (real && display === "ARS") v = v * (factores[mov.mes] || 1);
    return v;
  }, [display, real, factores]);

  const ingresos = movsMes.filter((m) => m.tipo === "ingreso").reduce((s, m) => s + conv(m, display), 0);
  const gastos = movsMes.filter((m) => m.tipo === "gasto").reduce((s, m) => s + conv(m, display), 0);
  const ahorro = ingresos - gastos;
  const tasa = ingresos > 0 ? (ahorro / ingresos) * 100 : 0;
  const deudaCredito = movsMes.filter((m) => m.tipo === "gasto" && m.medioPago === "credito").reduce((s, m) => s + conv(m, display), 0);

  const porCat = useMemo(() => {
    const map = {};
    movsMes.filter((m) => m.tipo === "gasto").forEach((m) => { map[m.cat] = (map[m.cat] || 0) + conv(m, display); });
    return Object.entries(map).map(([cat, monto]) => ({ cat, monto })).sort((a, b) => b.monto - a.monto);
  }, [movsMes, display]);

  const evo = useMemo(() => {
    if (!movs) return [];
    return meses.map((mm) => {
      const reales = movs.filter((x) => x.mes === mm);
      const todos = [...reales, ...recurrentesDelMes(recs, mm)];
      const ing = todos.filter((x) => x.tipo === "ingreso").reduce((s, x) => s + (real && display === "ARS" ? conv(x, display) * (factores[mm] || 1) : conv(x, display)), 0);
      const gas = todos.filter((x) => x.tipo === "gasto").reduce((s, x) => s + (real && display === "ARS" ? conv(x, display) * (factores[mm] || 1) : conv(x, display)), 0);
      return { mes: mm, label: mesCorto(mm), ingresos: ing, gastos: gas, ahorro: ing - gas };
    }).reduce((acc, row) => {
      const prev = acc.length ? acc[acc.length - 1].acumulado : 0;
      acc.push({ ...row, acumulado: prev + row.ahorro });
      return acc;
    }, []);
  }, [movs, recs, meses, real, display, factores]);

  const subsActivas = recs.filter((r) => !r.mesBaja || cmpMes(hoyMes(), r.mesBaja) <= 0);
  const costoSubsMes = subsActivas.reduce((s, r) => s + conv(r, display), 0);

  if (movs === null) return <div className="fin-loading">cargando…</div>;

  return (
    <div className="fin-root">
      <header className="fin-head">
        <div>
          <div className="fin-hello">Hola, <b>{getUsuario()}</b></div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.1 }}>Finanzas</div>
        </div>
        <div className="fin-head-actions">
          <div className="fin-cur-toggle">
            {["ARS", "USD"].map((c) => (
              <button key={c} className={display === c ? "on" : ""} onClick={() => { setDisplay(c); guardarCfg({ monedaDisplay: c }); }}>{c}</button>
            ))}
          </div>
          <div className="fin-menu-wrap">
            <button className="fin-icon-btn" onClick={() => setMenu((v) => !v)}>⋯</button>
            {menu && (
              <div className="fin-menu">
                {isAdmin() && <button onClick={() => { setView("admin"); setMenu(false); }}>Gestionar usuarios</button>}
                <button onClick={limpiar} className="danger">Borrar movimientos</button>
                <button onClick={() => { logout(); onLogout(); }}>Cerrar sesión</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {err && <div className="fin-err">{err}</div>}

      {view === "mes" && (
        <>
          <div className="fin-month-nav">
            <button onClick={() => setMes(addMes(mes, -1))}>‹</button>
            <span>{mesLabel(mes)}</span>
            <button onClick={() => setMes(addMes(mes, 1))}>›</button>
          </div>

          <div className="fin-hero">
            <div className="fin-hero-label">Ahorro del mes</div>
            <div className="fin-hero-value fin-mono" style={{ color: ahorro >= 0 ? C.pos : C.neg }}>{fmt(ahorro, display)}</div>
            <div className="fin-hero-sub">
              <span>Ingresos <b style={{ color: C.pos }}>{fmt(ingresos, display)}</b></span>
              <span>Gastos <b style={{ color: C.neg }}>{fmt(gastos, display)}</b></span>
            </div>
          </div>

          <div className="fin-grid2">
            <div className="fin-card">
              <span className="fin-card-label">Tasa de ahorro</span>
              <span className="fin-card-value fin-mono" style={{ color: tasa >= 20 ? C.pos : C.gold }}>{tasa.toFixed(0)}%</span>
              <span className="fin-card-sub">{tasa >= 20 ? "saludable" : "apuntá a 20%+"}</span>
            </div>
            <div className="fin-card">
              <span className="fin-card-label">Suscripciones</span>
              <span className="fin-card-value fin-mono" style={{ color: C.line }}>{fmt(costoSubsMes, display)}</span>
              <span className="fin-card-sub">{subsActivas.length} activas / mes</span>
            </div>
          </div>

          {deudaCredito > 0 && (
            <div className="fin-debt">
              <span className="fin-debt-ico">💳</span>
              <div className="fin-debt-info">
                <span>Gastos con tarjeta este mes</span>
                <b>{fmt(deudaCredito, display)}</b>
              </div>
            </div>
          )}

          <section className="fin-section">
            <div className="fin-section-head"><h2>En qué se va</h2></div>
            {porCat.length === 0 && <p className="fin-empty">Sin gastos este mes.</p>}
            {porCat.map((c) => (
              <div key={c.cat} className="fin-cat">
                <div className="fin-cat-top"><span>{c.cat}</span><span className="fin-mono">{fmt(c.monto, display)}</span></div>
                <div className="fin-cat-track"><div className="fin-cat-fill" style={{ width: `${gastos > 0 ? (c.monto / gastos) * 100 : 0}%` }} /></div>
              </div>
            ))}
          </section>

          <section className="fin-section">
            <div className="fin-section-head"><h2>Movimientos</h2></div>
            {movsMes.length === 0 && <p className="fin-empty">Todavía no cargaste nada este mes. Tocá el + para empezar.</p>}
            {movsMes.slice().sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map((m) => (
              <div key={m._id} className="fin-mov">
                <div className="fin-mov-ico">{m.virtual ? "🔁" : icoCat(m.cat)}</div>
                <div className="fin-mov-info">
                  <span className="fin-mov-cat">
                    {m.cat}
                    {m.cuotaNum && <span className="fin-tagpill cuota">{m.cuotaNum}/{m.cuotaTotal}</span>}
                    {m.virtual && <span className="fin-tagpill sub">sub</span>}
                    {!m.virtual && !m.cuotaNum && m.medioPago === "credito" && <span className="fin-tagpill credito">crédito</span>}
                  </span>
                  <span className="fin-mov-meta">
                    {diaLabel(m.fecha)}{m.moneda === "USD" ? ` · USD @ ${m.tc}` : ""}{m.desc ? ` · ${m.desc}` : ""}
                  </span>
                </div>
                <span className="fin-mov-monto" style={{ color: m.tipo === "ingreso" ? C.pos : C.neg }}>
                  {m.tipo === "ingreso" ? "+" : "−"}{fmt(conv(m, display), display)}
                </span>
                {!m.virtual && <button className="fin-del" onClick={() => delMov(m)}>×</button>}
              </div>
            ))}
          </section>
        </>
      )}

      {view === "evolucion" && (
        <>
          <div className="fin-evo-controls">
            <span>En <b>{display}</b>{real && display === "ARS" ? " · reales" : ""}</span>
            {display === "ARS" && (
              <button className={`fin-real ${real ? "on" : ""}`} onClick={() => setReal((v) => !v)}>
                {real ? "Real ✓" : "Ajustar por inflación"}
              </button>
            )}
          </div>
          <section className="fin-section">
            <p className="fin-sub">{real && display === "ARS" ? "Valores en pesos de hoy (descontada la inflación)." : "Ingresos vs gastos y ahorro acumulado."}</p>
            {evo.length === 0 ? <p className="fin-empty">Cargá movimientos para ver la evolución.</p> : (
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <ComposedChart data={evo} margin={{ top: 10, right: 4, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke={C.border} vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmtCompact} tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, fontSize: 12 }} formatter={(v, n) => [fmt(v, display), n]} />
                    <Bar dataKey="ingresos" name="Ingresos" fill={C.pos} radius={[4, 4, 0, 0]} maxBarSize={16} />
                    <Bar dataKey="gastos" name="Gastos" fill={C.neg} radius={[4, 4, 0, 0]} maxBarSize={16} />
                    <Line dataKey="acumulado" name="Acumulado" stroke={C.line} strokeWidth={2.5} dot={{ r: 3, fill: C.line }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="fin-legend">
              <span><i style={{ background: C.pos }} />Ingresos</span>
              <span><i style={{ background: C.neg }} />Gastos</span>
              <span><i style={{ background: C.line }} />Acumulado</span>
            </div>
          </section>
          <section className="fin-section">
            <div className="fin-section-head"><h2>Histórico</h2></div>
            {evo.slice().reverse().map((e) => (
              <button key={e.mes} className="fin-hist-row" onClick={() => { setMes(e.mes); setView("mes"); }}>
                <span>{mesLabel(e.mes)}</span>
                <span className="fin-mono" style={{ color: e.ahorro >= 0 ? C.pos : C.neg }}>{fmt(e.ahorro, display)}</span>
              </button>
            ))}
          </section>
        </>
      )}

      {view === "subs" && (
        <section className="fin-section">
          <div className="fin-section-head"><h2>Suscripciones y servicios</h2></div>
          <p className="fin-sub">Se cuentan en cada mes automáticamente. Dales de baja cuando dejes de pagarlas.</p>
          {recs.length === 0 && <p className="fin-empty">No tenés suscripciones cargadas. Tocá el + → Suscripción.</p>}
          {recs.map((r) => {
            const baja = r.mesBaja && cmpMes(hoyMes(), r.mesBaja) > 0;
            return (
              <div key={r._id} className="fin-sub-card" style={{ opacity: baja ? 0.5 : 1 }}>
                <div className="fin-mov-ico">🔁</div>
                <div className="fin-sub-info">
                  <b>{r.cat}</b>
                  <span>{r.desc ? r.desc + " · " : ""}día {r.diaDebito} · desde {mesCorto(r.mesInicio)}{r.mesBaja ? ` · baja ${mesCorto(r.mesBaja)}` : ""}</span>
                </div>
                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                  <span className="fin-sub-monto" style={{ color: C.line }}>{fmt(conv(r, display), display)}</span>
                  {baja
                    ? <span className="fin-badge-baja">dada de baja</span>
                    : <button className="fin-sub-baja" onClick={() => darBaja(r)}>Dar de baja</button>}
                </div>
                <button className="fin-del" onClick={() => borrarSub(r)}>×</button>
              </div>
            );
          })}
        </section>
      )}

      {view === "config" && <ConfigView cfg={cfg} meses={meses} onGuardar={guardarCfg} />}

      {view === "admin" && (isAdmin() ? <AdminUsuarios /> : <p className="fin-empty">No tenés permisos.</p>)}

      {/* nav inferior */}
      <nav className="fin-nav">
        <button className={view === "mes" ? "on" : ""} onClick={() => setView("mes")}><span className="ico">📊</span>Mes</button>
        <button className={view === "evolucion" ? "on" : ""} onClick={() => setView("evolucion")}><span className="ico">📈</span>Evolución</button>
        <button className="fin-fab" onClick={() => setModal(true)}><span className="ico">+</span></button>
        <button className={view === "subs" ? "on" : ""} onClick={() => setView("subs")}><span className="ico">🔁</span>Subs</button>
        <button className={view === "config" ? "on" : ""} onClick={() => setView("config")}><span className="ico">⚙️</span>Ajustes</button>
      </nav>

      {modal && (
        <AddModal
          mesActual={mes} tcDefault={cfg?.tcDefault || 1000}
          onClose={() => setModal(false)}
          onAddMov={addMov} onAddCuotas={addCuotas} onAddRecurrente={addRecurrente}
        />
      )}
    </div>
  );
}

function ConfigView({ cfg, meses, onGuardar }) {
  const [tc, setTc] = useState(cfg?.tcDefault || 1000);
  const infl = cfg?.inflacion || {};
  const lista = [...new Set([...(meses || []), hoyMes()])].sort();

  const setInfl = (m, v) => onGuardar({ inflacion: { ...infl, [m]: v === "" ? 0 : Number(v) } });

  return (
    <>
      <section className="fin-section">
        <div className="fin-section-head"><h2>Tipo de cambio</h2></div>
        <p className="fin-sub">Valor sugerido al cargar en USD (editable en cada movimiento).</p>
        <div className="fin-tc-row">
          <input className="fin-mono" inputMode="numeric" value={tc} onChange={(e) => setTc(e.target.value)} />
          <button onClick={() => onGuardar({ tcDefault: Number(tc) || 1000 })}>Guardar</button>
        </div>
      </section>
      <section className="fin-section">
        <div className="fin-section-head"><h2>Inflación mensual</h2></div>
        <p className="fin-sub">Cargá el IPC de cada mes para ver tus valores en pesos reales en Evolución. Se guarda solo.</p>
        {lista.length === 0 && <p className="fin-empty">Cargá movimientos primero.</p>}
        {lista.map((m) => (
          <div key={m} className="fin-infl-row">
            <span style={{ textTransform: "capitalize" }}>{mesLabel(m)}</span>
            <div className="fin-infl-input">
              <input className="fin-mono" inputMode="decimal" placeholder="0" defaultValue={infl[m] ?? ""} onBlur={(e) => setInfl(m, e.target.value)} />
              <span>%</span>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
