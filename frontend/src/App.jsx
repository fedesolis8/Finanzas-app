import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { api, getDolar } from "./api.js";

// ------------------------------------------------------------------
//  FINANZAS — mes a mes · multi-moneda (ARS/USD) · ajuste por inflación
// ------------------------------------------------------------------

const CUADRANTES = {
  E: { label: "Empleado", lado: "izq", desc: "Ingreso por tu tiempo (sueldo)" },
  S: { label: "Autoempleo", lado: "izq", desc: "Freelance / consultoría" },
  B: { label: "Negocio", lado: "der", desc: "Sistema que trabaja sin vos" },
  I: { label: "Inversión", lado: "der", desc: "Rinde dinero (activos)" },
};
const CAT_GASTO = ["Vivienda", "Comida", "Servicios", "Transporte", "Salud", "Ocio", "Educación", "Deudas", "Otros"];

const C = {
  bg: "#0a0c0b", surface: "#13161a", surface2: "#181c20", border: "rgba(255,255,255,0.07)",
  text: "#e9ece6", muted: "#828a82", pos: "#5fe3b3", neg: "#ff8a7a", gold: "#e8c06a", line: "#9bb1ff",
};

const fmt = (n, cur = "ARS") =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n || 0);
const fmtCompact = (n) => new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 }).format(n || 0);

const hoyMes = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
const mesLabel = (m) => { const [y, mm] = m.split("-").map(Number); return new Date(y, mm - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" }); };
const mesCorto = (m) => { const [y, mm] = m.split("-").map(Number); return new Date(y, mm - 1, 1).toLocaleDateString("es-AR", { month: "short" }).replace(".", ""); };
const addMes = (m, d) => { const [y, mm] = m.split("-").map(Number); const x = new Date(y, mm - 1 + d, 1); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`; };

// convierte un movimiento a la moneda de visualización usando su tc registrado
const conv = (mov, display) => {
  const tc = mov.tc || 1;
  if (mov.moneda === display) return mov.monto;
  if (display === "ARS") return mov.monto * tc;   // USD -> ARS
  return mov.monto / tc;                          // ARS -> USD
};

// factor para llevar pesos de cada mes a pesos del mes más reciente (base)
const factoresInflacion = (meses, inflacion) => {
  const f = {};
  const s = [...meses].sort();
  if (!s.length) return { f, base: null };
  const base = s[s.length - 1];
  f[base] = 1;
  for (let i = s.length - 2; i >= 0; i--) {
    const sig = s[i + 1];
    f[s[i]] = f[sig] * (1 + (Number(inflacion[sig]) || 0) / 100);
  }
  return { f, base };
};

const seedMovs = (tc) => {
  const b = hoyMes(); const m = (d) => addMes(b, d);
  return [
    { tipo: "ingreso", monto: 950000, moneda: "ARS", tc, cat: "Sueldo", cuad: "E", mes: m(-4), desc: "Leanval" },
    { tipo: "ingreso", monto: 180000, moneda: "ARS", tc, cat: "Consultoría", cuad: "S", mes: m(-4), desc: "Integraltek" },
    { tipo: "gasto", monto: 320000, moneda: "ARS", tc, cat: "Vivienda", mes: m(-4), desc: "Alquiler" },
    { tipo: "gasto", monto: 240000, moneda: "ARS", tc, cat: "Comida", mes: m(-4), desc: "" },
    { tipo: "ingreso", monto: 980000, moneda: "ARS", tc, cat: "Sueldo", cuad: "E", mes: m(-3), desc: "Leanval" },
    { tipo: "ingreso", monto: 300, moneda: "USD", tc, cat: "Cliente exterior", cuad: "S", mes: m(-3), desc: "Upwork" },
    { tipo: "gasto", monto: 320000, moneda: "ARS", tc, cat: "Vivienda", mes: m(-3), desc: "Alquiler" },
    { tipo: "gasto", monto: 210000, moneda: "ARS", tc, cat: "Comida", mes: m(-3), desc: "" },
    { tipo: "ingreso", monto: 1010000, moneda: "ARS", tc, cat: "Sueldo", cuad: "E", mes: m(-2), desc: "Leanval" },
    { tipo: "ingreso", monto: 340000, moneda: "ARS", tc, cat: "Consultoría", cuad: "S", mes: m(-2), desc: "Integraltek" },
    { tipo: "ingreso", monto: 200, moneda: "USD", tc, cat: "Plazo fijo USD", cuad: "I", mes: m(-2), desc: "" },
    { tipo: "gasto", monto: 350000, moneda: "ARS", tc, cat: "Vivienda", mes: m(-2), desc: "Alquiler" },
    { tipo: "ingreso", monto: 1010000, moneda: "ARS", tc, cat: "Sueldo", cuad: "E", mes: m(-1), desc: "Leanval" },
    { tipo: "ingreso", monto: 420000, moneda: "ARS", tc, cat: "Consultoría", cuad: "S", mes: m(-1), desc: "Integraltek" },
    { tipo: "ingreso", monto: 90000, moneda: "ARS", tc, cat: "MES SaaS", cuad: "B", mes: m(-1), desc: "primer cliente" },
    { tipo: "gasto", monto: 350000, moneda: "ARS", tc, cat: "Vivienda", mes: m(-1), desc: "Alquiler" },
    { tipo: "gasto", monto: 230000, moneda: "ARS", tc, cat: "Comida", mes: m(-1), desc: "" },
  ];
};

export default function App() {
  const [movs, setMovs] = useState(null);
  const [cfg, setCfg] = useState(null);
  const [display, setDisplay] = useState("ARS");
  const [real, setReal] = useState(false);
  const [mes, setMes] = useState(hoyMes());
  const [tab, setTab] = useState("mes");
  const [modal, setModal] = useState(false);
  const [menu, setMenu] = useState(false);
  const [err, setErr] = useState(null);

  // carga inicial
  useEffect(() => {
    (async () => {
      try {
        const [m, c] = await Promise.all([api.getMovs(), api.getConfig()]);
        setMovs(m); setCfg(c); setDisplay(c.monedaDisplay || "ARS");
      } catch (e) { setErr("No se pudo conectar con la API. Revisá VITE_API_URL y que el backend esté arriba."); setMovs([]); setCfg({ inflacion: {}, tcDefault: 1000 }); }
    })();
  }, []);

  const addMov = useCallback(async (m) => { const nuevo = await api.addMov(m); setMovs((p) => [...p, nuevo]); }, []);
  const delMov = useCallback(async (id) => { await api.delMov(id); setMovs((p) => p.filter((x) => x._id !== id)); }, []);
  const limpiar = async () => { if (confirm("¿Borrar TODOS los movimientos?")) { await api.clearMovs(); setMovs([]); setMenu(false); } };
  const cargarEjemplo = async () => { const tc = cfg?.tcDefault || 1100; const ins = await api.bulkMovs(seedMovs(tc)); setMovs((p) => [...p, ...ins]); setMenu(false); };
  const guardarCfg = useCallback(async (parcial) => { const next = { ...cfg, ...parcial }; setCfg(next); try { await api.setConfig(next); } catch {} }, [cfg]);

  const meses = useMemo(() => (movs ? [...new Set(movs.map((m) => m.mes))].sort() : []), [movs]);
  const { f: factores } = useMemo(() => factoresInflacion(meses, cfg?.inflacion || {}), [meses, cfg]);

  // valor de un movimiento en la moneda/modo elegido
  const valor = useCallback((mov) => {
    let v = conv(mov, display);
    if (real && display === "ARS") v = v * (factores[mov.mes] || 1);
    return v;
  }, [display, real, factores]);

  const evo = useMemo(() => {
    if (!movs) return [];
    let acum = 0;
    return meses.map((mm) => {
      const ing = movs.filter((x) => x.mes === mm && x.tipo === "ingreso").reduce((s, x) => s + valor(x), 0);
      const gas = movs.filter((x) => x.mes === mm && x.tipo === "gasto").reduce((s, x) => s + valor(x), 0);
      acum += ing - gas;
      return { mes: mm, label: mesCorto(mm), ingresos: ing, gastos: gas, ahorro: ing - gas, acumulado: acum };
    });
  }, [movs, meses, valor]);

  const delMes = useMemo(() => (movs || []).filter((m) => m.mes === mes), [movs, mes]);
  const ingresos = delMes.filter((m) => m.tipo === "ingreso").reduce((s, m) => s + conv(m, display), 0);
  const gastos = delMes.filter((m) => m.tipo === "gasto").reduce((s, m) => s + conv(m, display), 0);
  const ahorro = ingresos - gastos;
  const tasa = ingresos > 0 ? (ahorro / ingresos) * 100 : 0;

  const porCat = useMemo(() => {
    const map = {};
    delMes.filter((m) => m.tipo === "gasto").forEach((m) => { map[m.cat] = (map[m.cat] || 0) + conv(m, display); });
    return Object.entries(map).map(([cat, monto]) => ({ cat, monto })).sort((a, b) => b.monto - a.monto);
  }, [delMes, display]);

  const porCuad = useMemo(() => {
    const map = { E: 0, S: 0, B: 0, I: 0 };
    delMes.filter((m) => m.tipo === "ingreso").forEach((m) => { map[m.cuad || "S"] += conv(m, display); });
    return map;
  }, [delMes, display]);
  const pctDer = ingresos > 0 ? ((porCuad.B + porCuad.I) / ingresos) * 100 : 0;

  if (movs === null) return <div className="fin-loading">cargando…<style>{styles}</style></div>;

  return (
    <div className="fin-root">
      <style>{styles}</style>

      <header className="fin-head">
        <div>
          <div className="fin-kicker">tu dinero · mes a mes</div>
          <h1 className="fin-title">Finanzas</h1>
        </div>
        <div className="fin-head-right">
          <div className="fin-cur-toggle">
            {["ARS", "USD"].map((c) => (
              <button key={c} className={display === c ? "on" : ""} onClick={() => setDisplay(c)}>{c}</button>
            ))}
          </div>
          <div className="fin-menu-wrap">
            <button className="fin-icon-btn" onClick={() => setMenu((v) => !v)}>⋯</button>
            {menu && (
              <div className="fin-menu">
                <button onClick={cargarEjemplo}>Cargar ejemplo</button>
                <button onClick={limpiar}>Empezar de cero</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {err && <div className="fin-err">{err}</div>}

      <div className="fin-tabs">
        <button className={tab === "mes" ? "on" : ""} onClick={() => setTab("mes")}>Este mes</button>
        <button className={tab === "evolucion" ? "on" : ""} onClick={() => setTab("evolucion")}>Evolución</button>
        <button className={tab === "config" ? "on" : ""} onClick={() => setTab("config")}>Ajustes</button>
      </div>

      {tab === "mes" && (
        <>
          <div className="fin-month-nav">
            <button onClick={() => setMes(addMes(mes, -1))}>‹</button>
            <span>{mesLabel(mes)}</span>
            <button onClick={() => setMes(addMes(mes, 1))}>›</button>
          </div>

          <div className="fin-grid2">
            <Card label="Ingresos" value={fmt(ingresos, display)} accent={C.pos} />
            <Card label="Gastos" value={fmt(gastos, display)} accent={C.neg} />
            <Card label="Ahorro" value={fmt(ahorro, display)} accent={ahorro >= 0 ? C.pos : C.neg} big />
            <Card label="Tasa de ahorro" value={`${tasa.toFixed(0)}%`} accent={tasa >= 20 ? C.pos : C.gold} big sub={tasa >= 20 ? "saludable" : "apuntá a 20%+"} />
          </div>

          <button className="fin-add" onClick={() => setModal(true)}>+ Agregar movimiento</button>

          <Section title="De dónde viene tu plata" sub="Cuadrante de Kiyosaki — mové ingresos al lado derecho (B + I)">
            <div className="fin-bi-bar">
              {["E", "S", "B", "I"].map((k) => {
                const pct = ingresos > 0 ? (porCuad[k] / ingresos) * 100 : 0;
                return pct ? <div key={k} style={{ width: `${pct}%`, background: CUADRANTES[k].lado === "der" ? C.gold : "#3a4a44" }} /> : null;
              })}
              {ingresos === 0 && <div className="fin-bi-empty">sin ingresos este mes</div>}
            </div>
            <div className="fin-bi-legend">
              {["E", "S", "B", "I"].map((k) => {
                const pct = ingresos > 0 ? (porCuad[k] / ingresos) * 100 : 0;
                return (
                  <div key={k} className="fin-bi-row">
                    <span className="fin-bi-dot" style={{ background: CUADRANTES[k].lado === "der" ? C.gold : "#3a4a44" }} />
                    <b>{k}</b> <span className="fin-bi-name">{CUADRANTES[k].label}</span>
                    <span className="fin-bi-pct">{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
            <div className="fin-der" style={{ borderColor: pctDer >= 30 ? C.pos : C.border }}>
              <span>Lado derecho (negocio + inversión)</span>
              <b style={{ color: pctDer > 0 ? C.gold : C.muted }}>{pctDer.toFixed(0)}%</b>
            </div>
          </Section>

          <Section title="En qué se va" sub="Gastos del mes por categoría">
            {porCat.length === 0 && <p className="fin-empty">No hay gastos cargados este mes.</p>}
            {porCat.map((c) => (
              <div key={c.cat} className="fin-cat">
                <div className="fin-cat-top"><span>{c.cat}</span><span className="fin-mono">{fmt(c.monto, display)}</span></div>
                <div className="fin-cat-track"><div className="fin-cat-fill" style={{ width: `${gastos > 0 ? (c.monto / gastos) * 100 : 0}%` }} /></div>
              </div>
            ))}
          </Section>

          <Section title="Movimientos del mes">
            {delMes.length === 0 && <p className="fin-empty">Todavía no cargaste nada este mes.</p>}
            {delMes.slice().reverse().map((m) => (
              <div key={m._id} className="fin-mov">
                <div className="fin-mov-dot" style={{ background: m.tipo === "ingreso" ? C.pos : C.neg }} />
                <div className="fin-mov-info">
                  <span className="fin-mov-cat">{m.cat}{m.tipo === "ingreso" && m.cuad ? ` · ${m.cuad}` : ""}</span>
                  <span className="fin-mov-desc">{m.moneda}{m.moneda === "USD" ? ` @ ${m.tc}` : ""}{m.desc ? ` · ${m.desc}` : ""}</span>
                </div>
                <span className="fin-mono" style={{ color: m.tipo === "ingreso" ? C.pos : C.neg }}>
                  {m.tipo === "ingreso" ? "+" : "−"}{fmt(conv(m, display), display)}
                </span>
                <button className="fin-del" onClick={() => delMov(m._id)}>×</button>
              </div>
            ))}
          </Section>
        </>
      )}

      {tab === "evolucion" && (
        <>
          <div className="fin-evo-controls">
            <span>Mostrando en <b>{display}</b>{real && display === "ARS" ? " (valores reales)" : ""}</span>
            {display === "ARS" && (
              <button className={`fin-real ${real ? "on" : ""}`} onClick={() => setReal((v) => !v)}>
                {real ? "Real ✓" : "Ajustar por inflación"}
              </button>
            )}
          </div>
          <Section title="Evolución" sub={real && display === "ARS" ? "Valores llevados a pesos de hoy (descontada la inflación)" : "Ingresos vs gastos, y ahorro acumulado"}>
            {evo.length === 0 ? <p className="fin-empty">Cargá movimientos para ver la evolución.</p> : (
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <ComposedChart data={evo} margin={{ top: 10, right: 4, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke={C.border} vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmtCompact} tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, fontSize: 12 }} formatter={(v, n) => [fmt(v, display), n]} />
                    <Bar dataKey="ingresos" name="Ingresos" fill={C.pos} radius={[4, 4, 0, 0]} maxBarSize={18} />
                    <Bar dataKey="gastos" name="Gastos" fill={C.neg} radius={[4, 4, 0, 0]} maxBarSize={18} />
                    <Line dataKey="acumulado" name="Acumulado" stroke={C.line} strokeWidth={2.5} dot={{ r: 3, fill: C.line }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="fin-legend">
              <span><i style={{ background: C.pos }} />Ingresos</span>
              <span><i style={{ background: C.neg }} />Gastos</span>
              <span><i style={{ background: C.line }} />Ahorro acumulado</span>
            </div>
          </Section>

          <Section title="Resumen histórico">
            <div className="fin-hist">
              {evo.slice().reverse().map((e) => (
                <button key={e.mes} className="fin-hist-row" onClick={() => { setMes(e.mes); setTab("mes"); }}>
                  <span>{mesLabel(e.mes)}</span>
                  <span className="fin-mono" style={{ color: e.ahorro >= 0 ? C.pos : C.neg }}>{fmt(e.ahorro, display)}</span>
                </button>
              ))}
            </div>
          </Section>
        </>
      )}

      {tab === "config" && (
        <ConfigTab cfg={cfg} meses={meses} onGuardar={guardarCfg} />
      )}

      {modal && <FormModal mes={mes} tcDefault={cfg?.tcDefault || 1000} onClose={() => setModal(false)} onAdd={addMov} />}

      <footer className="fin-foot">Datos en tu base · ARS / USD</footer>
    </div>
  );
}

function Card({ label, value, accent, big, sub }) {
  return (
    <div className={`fin-card ${big ? "big" : ""}`}>
      <span className="fin-card-label">{label}</span>
      <span className="fin-card-value fin-mono" style={{ color: accent }}>{value}</span>
      {sub && <span className="fin-card-sub">{sub}</span>}
    </div>
  );
}

function Section({ title, sub, children }) {
  return (
    <section className="fin-section">
      <h2>{title}</h2>
      {sub && <p className="fin-sub">{sub}</p>}
      {children}
    </section>
  );
}

function ConfigTab({ cfg, meses, onGuardar }) {
  const [tc, setTc] = useState(cfg?.tcDefault || 1000);
  const infl = cfg?.inflacion || {};
  // meses para editar inflación: los que tienen datos + el actual
  const lista = [...new Set([...(meses || []), hoyMes()])].sort();

  const setInfl = (m, v) => {
    const next = { ...infl, [m]: v === "" ? 0 : Number(v) };
    onGuardar({ inflacion: next });
  };

  return (
    <>
      <Section title="Tipo de cambio por defecto" sub="Valor sugerido al cargar un movimiento (editable en cada uno)">
        <div className="fin-tc-row">
          <input className="fin-mono" inputMode="numeric" value={tc} onChange={(e) => setTc(e.target.value)} />
          <button onClick={() => onGuardar({ tcDefault: Number(tc) || 1000 })}>Guardar</button>
        </div>
      </Section>

      <Section title="Inflación mensual (%)" sub="Cargá la inflación de cada mes (IPC INDEC) para ver tus valores en pesos reales. Se guarda solo.">
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
      </Section>
    </>
  );
}

function FormModal({ mes, tcDefault, onClose, onAdd }) {
  const [tipo, setTipo] = useState("gasto");
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState("ARS");
  const [tc, setTc] = useState(tcDefault);
  const [cat, setCat] = useState("");
  const [cuad, setCuad] = useState("E");
  const [desc, setDesc] = useState("");
  const [m, setM] = useState(mes);
  const [saving, setSaving] = useState(false);

  // autocompletar tc con el blue
  useEffect(() => { getDolar().then((v) => { if (v) setTc(v); }); }, []);

  const submit = async () => {
    const n = parseFloat(String(monto).replace(/[^\d.]/g, ""));
    if (!n || n <= 0) return;
    setSaving(true);
    try {
      await onAdd({
        tipo, monto: n, moneda, tc: Number(tc) || 1,
        cat: cat || (tipo === "ingreso" ? "Ingreso" : "Otros"),
        cuad: tipo === "ingreso" ? cuad : null, desc, mes: m,
      });
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <div className="fin-overlay" onClick={onClose}>
      <div className="fin-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Nuevo movimiento</h3>

        <div className="fin-seg">
          <button className={tipo === "gasto" ? "on neg" : ""} onClick={() => setTipo("gasto")}>Gasto</button>
          <button className={tipo === "ingreso" ? "on pos" : ""} onClick={() => setTipo("ingreso")}>Ingreso</button>
        </div>

        <label>Monto</label>
        <div className="fin-monto-row">
          <input className="fin-mono" inputMode="numeric" placeholder="0" value={monto} onChange={(e) => setMonto(e.target.value)} autoFocus />
          <div className="fin-seg fin-seg-sm">
            {["ARS", "USD"].map((c) => <button key={c} className={moneda === c ? "on" : ""} onClick={() => setMoneda(c)}>{c}</button>)}
          </div>
        </div>

        <label>Tipo de cambio · ARS por 1 USD <span className="fin-tag">a qué valor lo registrás</span></label>
        <input className="fin-mono" inputMode="numeric" value={tc} onChange={(e) => setTc(e.target.value)} />

        <label>{tipo === "ingreso" ? "Fuente" : "Categoría"}</label>
        {tipo === "gasto" ? (
          <div className="fin-chips">{CAT_GASTO.map((c) => <button key={c} className={cat === c ? "on" : ""} onClick={() => setCat(c)}>{c}</button>)}</div>
        ) : (
          <input placeholder="Ej: Sueldo, Cliente X, dividendos" value={cat} onChange={(e) => setCat(e.target.value)} />
        )}

        {tipo === "ingreso" && (
          <>
            <label>Cuadrante (B/I)</label>
            <div className="fin-chips">{Object.keys(CUADRANTES).map((k) => <button key={k} className={cuad === k ? "on" : ""} onClick={() => setCuad(k)} title={CUADRANTES[k].desc}>{k} · {CUADRANTES[k].label}</button>)}</div>
            <p className="fin-hint">{CUADRANTES[cuad].desc}</p>
          </>
        )}

        <label>Nota (opcional)</label>
        <input placeholder="detalle" value={desc} onChange={(e) => setDesc(e.target.value)} />

        <label>Mes</label>
        <input type="month" value={m} onChange={(e) => setM(e.target.value)} />

        <div className="fin-modal-actions">
          <button className="ghost" onClick={onClose}>Cancelar</button>
          <button className="primary" onClick={submit} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</button>
        </div>
      </div>
    </div>
  );
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
* { box-sizing: border-box; }
.fin-loading { background: ${C.bg}; color: ${C.muted}; min-height: 100vh; display: grid; place-items: center; font-family: monospace; }
.fin-root { font-family: 'Bricolage Grotesque', system-ui, sans-serif; background: ${C.bg}; color: ${C.text}; min-height: 100vh; max-width: 480px; margin: 0 auto; padding: 18px 16px 40px; -webkit-font-smoothing: antialiased; }
.fin-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }

.fin-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.fin-head-right { display: flex; gap: 8px; align-items: center; }
.fin-kicker { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: ${C.muted}; }
.fin-title { font-size: 32px; font-weight: 800; letter-spacing: -.02em; margin: 2px 0 0; line-height: 1; }
.fin-cur-toggle { display: flex; background: ${C.surface}; border-radius: 10px; padding: 3px; }
.fin-cur-toggle button { background: none; border: none; color: ${C.muted}; padding: 7px 10px; border-radius: 7px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 600; cursor: pointer; }
.fin-cur-toggle button.on { background: ${C.surface2}; color: ${C.text}; }
.fin-menu-wrap { position: relative; }
.fin-icon-btn { background: ${C.surface}; border: 1px solid ${C.border}; color: ${C.text}; width: 38px; height: 38px; border-radius: 12px; font-size: 20px; cursor: pointer; }
.fin-menu { position: absolute; right: 0; top: 44px; background: ${C.surface2}; border: 1px solid ${C.border}; border-radius: 12px; overflow: hidden; z-index: 20; min-width: 160px; }
.fin-menu button { display: block; width: 100%; text-align: left; background: none; border: none; color: ${C.text}; padding: 12px 14px; font-size: 14px; cursor: pointer; font-family: inherit; }
.fin-menu button:hover { background: ${C.surface}; }
.fin-err { background: rgba(255,138,122,.12); border: 1px solid ${C.neg}; color: ${C.neg}; padding: 11px 13px; border-radius: 12px; font-size: 12.5px; margin-bottom: 14px; }

.fin-tabs { display: flex; gap: 6px; background: ${C.surface}; padding: 4px; border-radius: 14px; margin-bottom: 18px; }
.fin-tabs button { flex: 1; background: none; border: none; color: ${C.muted}; padding: 9px; border-radius: 10px; font-family: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; }
.fin-tabs button.on { background: ${C.surface2}; color: ${C.text}; }

.fin-month-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.fin-month-nav span { font-size: 17px; font-weight: 600; text-transform: capitalize; }
.fin-month-nav button { background: ${C.surface}; border: 1px solid ${C.border}; color: ${C.text}; width: 40px; height: 40px; border-radius: 12px; font-size: 20px; cursor: pointer; }

.fin-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
.fin-card { background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 16px; padding: 14px 15px; display: flex; flex-direction: column; gap: 4px; }
.fin-card-label { font-size: 12px; color: ${C.muted}; }
.fin-card-value { font-size: 19px; font-weight: 600; letter-spacing: -.01em; }
.fin-card.big .fin-card-value { font-size: 23px; }
.fin-card-sub { font-size: 11px; color: ${C.muted}; }

.fin-add { width: 100%; background: ${C.pos}; color: #04130d; border: none; border-radius: 14px; padding: 15px; font-family: inherit; font-size: 16px; font-weight: 700; cursor: pointer; margin-bottom: 22px; }
.fin-add:active { transform: scale(.99); }

.fin-section { margin-bottom: 26px; }
.fin-section h2 { font-size: 19px; font-weight: 700; margin: 0 0 2px; letter-spacing: -.01em; }
.fin-sub { font-size: 12.5px; color: ${C.muted}; margin: 0 0 14px; line-height: 1.4; }
.fin-empty { color: ${C.muted}; font-size: 13px; }

.fin-bi-bar { display: flex; height: 14px; border-radius: 7px; overflow: hidden; background: ${C.surface}; margin-bottom: 14px; position: relative; }
.fin-bi-bar > div { transition: width .4s; }
.fin-bi-empty { position: absolute; inset: 0; display: grid; place-items: center; font-size: 11px; color: ${C.muted}; }
.fin-bi-legend { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin-bottom: 14px; }
.fin-bi-row { display: flex; align-items: center; gap: 7px; font-size: 13px; }
.fin-bi-dot { width: 9px; height: 9px; border-radius: 3px; flex-shrink: 0; }
.fin-bi-name { color: ${C.muted}; flex: 1; }
.fin-bi-pct { font-family: 'IBM Plex Mono', monospace; font-weight: 600; }
.fin-der { display: flex; justify-content: space-between; align-items: center; background: ${C.surface}; border: 1px solid; border-radius: 12px; padding: 12px 14px; font-size: 13px; }
.fin-der b { font-family: 'IBM Plex Mono', monospace; font-size: 18px; }

.fin-cat { margin-bottom: 12px; }
.fin-cat-top { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 5px; }
.fin-cat-track { height: 7px; background: ${C.surface}; border-radius: 4px; overflow: hidden; }
.fin-cat-fill { height: 100%; background: ${C.neg}; border-radius: 4px; transition: width .4s; }

.fin-mov { display: flex; align-items: center; gap: 11px; padding: 11px 0; border-bottom: 1px solid ${C.border}; }
.fin-mov-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.fin-mov-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.fin-mov-cat { font-size: 14px; font-weight: 500; }
.fin-mov-desc { font-size: 11.5px; color: ${C.muted}; }
.fin-mov .fin-mono { font-size: 14px; font-weight: 500; white-space: nowrap; }
.fin-del { background: none; border: none; color: ${C.muted}; font-size: 20px; cursor: pointer; padding: 0 2px; line-height: 1; }

.fin-evo-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; font-size: 13px; color: ${C.muted}; }
.fin-evo-controls b { color: ${C.text}; }
.fin-real { background: ${C.surface}; border: 1px solid ${C.border}; color: ${C.muted}; padding: 8px 12px; border-radius: 10px; font-family: inherit; font-size: 12.5px; cursor: pointer; }
.fin-real.on { background: ${C.gold}; color: #1c1404; border-color: ${C.gold}; font-weight: 600; }

.fin-legend { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 10px; font-size: 12px; color: ${C.muted}; }
.fin-legend span { display: flex; align-items: center; gap: 6px; }
.fin-legend i { width: 10px; height: 10px; border-radius: 3px; }

.fin-hist-row { display: flex; justify-content: space-between; align-items: center; width: 100%; background: none; border: none; border-bottom: 1px solid ${C.border}; color: ${C.text}; padding: 13px 0; font-family: inherit; font-size: 14px; text-transform: capitalize; cursor: pointer; }
.fin-hist-row:active { opacity: .6; }

.fin-tc-row { display: flex; gap: 10px; }
.fin-tc-row input { flex: 1; background: ${C.bg}; border: 1px solid ${C.border}; border-radius: 12px; color: ${C.text}; padding: 13px; font-size: 16px; }
.fin-tc-row button { background: ${C.pos}; color: #04130d; border: none; border-radius: 12px; padding: 0 20px; font-family: inherit; font-weight: 700; cursor: pointer; }
.fin-infl-row { display: flex; justify-content: space-between; align-items: center; padding: 9px 0; border-bottom: 1px solid ${C.border}; font-size: 14px; }
.fin-infl-input { display: flex; align-items: center; gap: 6px; }
.fin-infl-input input { width: 80px; background: ${C.bg}; border: 1px solid ${C.border}; border-radius: 10px; color: ${C.text}; padding: 9px; text-align: right; font-size: 15px; }
.fin-infl-input span { color: ${C.muted}; }

.fin-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); backdrop-filter: blur(3px); z-index: 100; display: flex; align-items: flex-end; justify-content: center; }
.fin-modal { background: ${C.surface2}; border: 1px solid ${C.border}; border-radius: 22px 22px 0 0; width: 100%; max-width: 480px; padding: 22px 18px 30px; max-height: 92vh; overflow-y: auto; animation: up .25s ease; }
@keyframes up { from { transform: translateY(40px); opacity: 0; } }
.fin-modal h3 { font-size: 20px; font-weight: 700; margin: 0 0 16px; }
.fin-modal label { display: block; font-size: 12px; color: ${C.muted}; margin: 14px 0 6px; }
.fin-tag { background: ${C.surface}; color: ${C.muted}; padding: 2px 7px; border-radius: 6px; font-size: 10.5px; margin-left: 4px; }
.fin-modal input { width: 100%; background: ${C.bg}; border: 1px solid ${C.border}; border-radius: 12px; color: ${C.text}; padding: 13px; font-family: inherit; font-size: 16px; }
.fin-modal input:focus { outline: none; border-color: ${C.muted}; }
.fin-monto-row { display: flex; gap: 8px; }
.fin-monto-row > input { flex: 1; }
.fin-seg { display: flex; gap: 6px; background: ${C.bg}; padding: 4px; border-radius: 12px; }
.fin-seg-sm { padding: 3px; }
.fin-seg button { flex: 1; background: none; border: none; color: ${C.muted}; padding: 11px; border-radius: 9px; font-family: inherit; font-size: 15px; font-weight: 600; cursor: pointer; }
.fin-seg-sm button { padding: 9px 12px; font-family: 'IBM Plex Mono', monospace; font-size: 13px; }
.fin-seg button.on { background: ${C.surface}; color: ${C.text}; }
.fin-seg button.on.neg { background: ${C.neg}; color: #1a0703; }
.fin-seg button.on.pos { background: ${C.pos}; color: #04130d; }
.fin-chips { display: flex; flex-wrap: wrap; gap: 7px; }
.fin-chips button { background: ${C.bg}; border: 1px solid ${C.border}; color: ${C.text}; padding: 9px 12px; border-radius: 10px; font-family: inherit; font-size: 13px; cursor: pointer; }
.fin-chips button.on { background: ${C.text}; color: ${C.bg}; border-color: ${C.text}; }
.fin-hint { font-size: 12px; color: ${C.muted}; margin: 8px 0 0; }
.fin-modal-actions { display: flex; gap: 10px; margin-top: 22px; }
.fin-modal-actions button { flex: 1; padding: 14px; border-radius: 13px; font-family: inherit; font-size: 15px; font-weight: 700; cursor: pointer; border: none; }
.fin-modal-actions .ghost { background: none; border: 1px solid ${C.border}; color: ${C.text}; }
.fin-modal-actions .primary { background: ${C.pos}; color: #04130d; }
.fin-modal-actions .primary:disabled { opacity: .6; }

.fin-foot { text-align: center; font-size: 11px; color: ${C.muted}; margin-top: 30px; }
`;
