// ------- formato -------
export const fmt = (n, cur = "ARS") =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n || 0);
export const fmtCompact = (n) =>
  new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 1 }).format(n || 0);

// ------- meses / fechas -------
export const hoyMes = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
export const hoyFecha = () => new Date().toISOString().slice(0, 10);
export const mesDeFecha = (iso) => iso.slice(0, 7);
export const mesLabel = (m) => { const [y, mm] = m.split("-").map(Number); return new Date(y, mm - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" }); };
export const mesCorto = (m) => { const [y, mm] = m.split("-").map(Number); return new Date(y, mm - 1, 1).toLocaleDateString("es-AR", { month: "short" }).replace(".", ""); };
export const diaLabel = (iso) => { const d = new Date(iso); return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" }).replace(".", ""); };
export const addMes = (m, delta) => { const [y, mm] = m.split("-").map(Number); const x = new Date(y, mm - 1 + delta, 1); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`; };
export const cmpMes = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// ------- conversión de moneda -------
export const conv = (mov, display) => {
  const tc = mov.tc || 1;
  if (mov.moneda === display) return mov.monto;
  if (display === "ARS") return mov.monto * tc;
  return mov.monto / tc;
};

// ------- inflación: factor para llevar cada mes a pesos del mes más reciente -------
export const factoresInflacion = (meses, inflacion) => {
  const f = {};
  const s = [...meses].sort();
  if (!s.length) return f;
  const base = s[s.length - 1];
  f[base] = 1;
  for (let i = s.length - 2; i >= 0; i--) {
    const sig = s[i + 1];
    f[s[i]] = f[sig] * (1 + (Number(inflacion[sig]) || 0) / 100);
  }
  return f;
};

// ------- expandir suscripciones recurrentes a movimientos virtuales de un mes -------
export const recurrentesDelMes = (recurrentes, mes) => {
  return recurrentes
    .filter((r) => cmpMes(r.mesInicio, mes) <= 0 && (!r.mesBaja || cmpMes(mes, r.mesBaja) <= 0))
    .map((r) => {
      const [y, mm] = mes.split("-").map(Number);
      const dia = Math.min(r.diaDebito || 1, new Date(y, mm, 0).getDate());
      return {
        _id: `rec-${r._id}-${mes}`, virtual: true, recurrenteId: r._id,
        tipo: r.tipo, monto: r.monto, moneda: r.moneda, tc: r.tc,
        cat: r.cat, desc: r.desc, medioPago: r.medioPago,
        fecha: new Date(y, mm - 1, dia).toISOString(), mes,
      };
    });
};

// rango de meses que abarca los datos (movimientos + recurrentes activas hasta hoy)
export const rangoMeses = (movs, recurrentes) => {
  const set = new Set(movs.map((m) => m.mes));
  const hoy = hoyMes();
  recurrentes.forEach((r) => {
    let m = r.mesInicio;
    const fin = r.mesBaja && cmpMes(r.mesBaja, hoy) < 0 ? r.mesBaja : hoy;
    let guard = 0;
    while (cmpMes(m, fin) <= 0 && guard < 600) { set.add(m); m = addMes(m, 1); guard++; }
  });
  return [...set].sort();
};
