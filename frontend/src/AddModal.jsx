import React, { useState, useEffect } from "react";
import { getDolar } from "./api.js";
import { fmt, hoyFecha, hoyMes, mesLabel, addMes } from "./helpers.js";

const CAT_GASTO = ["Vivienda", "Comida", "Servicios", "Transporte", "Salud", "Ocio", "Educación", "Deudas", "Otros"];
const MEDIOS = [
  { k: "efectivo", l: "Efectivo" },
  { k: "debito", l: "Débito" },
  { k: "credito", l: "Crédito" },
];

// kind: 'gasto' | 'ingreso' | 'cuotas' | 'suscripcion'
export default function AddModal({ mesActual, tcDefault, onClose, onAddMov, onAddCuotas, onAddRecurrente }) {
  const [kind, setKind] = useState("gasto");
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState("ARS");
  const [tc, setTc] = useState(tcDefault || 1000);
  const [cat, setCat] = useState("");
  const [desc, setDesc] = useState("");
  const [medio, setMedio] = useState("efectivo");
  const [fecha, setFecha] = useState(hoyFecha());
  const [saving, setSaving] = useState(false);

  // cuotas
  const [modoCuota, setModoCuota] = useState("total"); // 'total' | 'cuota'
  const [cantidad, setCantidad] = useState("3");
  const [mesInicio, setMesInicio] = useState(mesActual || hoyMes());
  const [diaImpacto, setDiaImpacto] = useState("10");

  // suscripcion
  const [diaDebito, setDiaDebito] = useState("1");

  useEffect(() => { getDolar().then((v) => { if (v) setTc(v); }); }, []);

  const num = (v) => parseFloat(String(v).replace(/[^\d.]/g, "")) || 0;
  const montoN = num(monto);
  const cantN = Math.max(1, parseInt(cantidad) || 1);
  const valorCuota = modoCuota === "total" ? Math.round(montoN / cantN) : montoN;
  const totalCuotas = modoCuota === "total" ? montoN : montoN * cantN;

  const submit = async () => {
    if (montoN <= 0) return;
    setSaving(true);
    try {
      if (kind === "cuotas") {
        await onAddCuotas({
          modo: modoCuota,
          montoTotal: modoCuota === "total" ? montoN : undefined,
          montoCuota: modoCuota === "cuota" ? montoN : undefined,
          cantidad: cantN, mesInicio, diaImpacto: parseInt(diaImpacto) || 1,
          moneda, tc: Number(tc) || 1, cat: cat || "Cuotas", desc, medioPago: "credito",
        });
      } else if (kind === "suscripcion") {
        await onAddRecurrente({
          tipo: "gasto", monto: montoN, moneda, tc: Number(tc) || 1,
          cat: cat || "Suscripción", desc, medioPago: medio,
          diaDebito: parseInt(diaDebito) || 1, mesInicio,
        });
      } else {
        await onAddMov({
          tipo: kind, monto: montoN, moneda, tc: Number(tc) || 1,
          cat: cat || (kind === "ingreso" ? "Ingreso" : "Otros"),
          desc, medioPago: kind === "gasto" ? medio : null, fecha,
        });
      }
      onClose();
    } catch (e) {
      alert(e.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const esGastoSimple = kind === "gasto";
  const tituloMonto = kind === "cuotas" ? (modoCuota === "total" ? "Monto total" : "Monto por cuota") : "Monto";

  return (
    <div className="fin-overlay" onClick={onClose}>
      <div className="fin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fin-grip" />
        <h3>Agregar</h3>

        {/* tipo */}
        <div className="fin-kind">
          {[
            { k: "gasto", l: "Gasto", i: "🛒" },
            { k: "ingreso", l: "Ingreso", i: "💰" },
            { k: "cuotas", l: "En cuotas", i: "💳" },
            { k: "suscripcion", l: "Suscripción", i: "🔁" },
          ].map((o) => (
            <button key={o.k} className={kind === o.k ? "on" : ""} onClick={() => setKind(o.k)}>
              <span className="ico">{o.i}</span>{o.l}
            </button>
          ))}
        </div>

        {/* modalidad de cuota */}
        {kind === "cuotas" && (
          <>
            <label>Cómo lo cargás</label>
            <div className="fin-seg">
              <button className={modoCuota === "total" ? "on" : ""} onClick={() => setModoCuota("total")}>Total ÷ cuotas</button>
              <button className={modoCuota === "cuota" ? "on" : ""} onClick={() => setModoCuota("cuota")}>Monto × cuota</button>
            </div>
          </>
        )}

        {/* monto + moneda */}
        <label>{tituloMonto}</label>
        <div className="fin-monto-row">
          <input className="fin-mono" inputMode="numeric" placeholder="0" value={monto} onChange={(e) => setMonto(e.target.value)} autoFocus />
          <div className="fin-seg sm">
            {["ARS", "USD"].map((c) => <button key={c} className={moneda === c ? "on" : ""} onClick={() => setMoneda(c)}>{c}</button>)}
          </div>
        </div>

        {/* tc si es USD */}
        {moneda === "USD" && (
          <>
            <label>Tipo de cambio · ARS por 1 USD <span className="fin-tag">a qué valor</span></label>
            <input className="fin-mono" inputMode="numeric" value={tc} onChange={(e) => setTc(e.target.value)} />
          </>
        )}

        {/* cuotas: cantidad + inicio + dia */}
        {kind === "cuotas" && (
          <>
            <div className="fin-row2">
              <div>
                <label>Cantidad de cuotas</label>
                <input className="fin-mono" inputMode="numeric" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
              </div>
              <div>
                <label>Día de impacto</label>
                <input className="fin-mono" inputMode="numeric" value={diaImpacto} onChange={(e) => setDiaImpacto(e.target.value)} />
              </div>
            </div>
            <label>Primera cuota impacta en</label>
            <input type="month" value={mesInicio} onChange={(e) => setMesInicio(e.target.value)} />
          </>
        )}

        {/* suscripcion: dia + desde */}
        {kind === "suscripcion" && (
          <>
            <div className="fin-row2">
              <div>
                <label>Día de débito</label>
                <input className="fin-mono" inputMode="numeric" value={diaDebito} onChange={(e) => setDiaDebito(e.target.value)} />
              </div>
              <div>
                <label>Medio</label>
                <select value={medio} onChange={(e) => setMedio(e.target.value)}>
                  {MEDIOS.map((m) => <option key={m.k} value={m.k}>{m.l}</option>)}
                </select>
              </div>
            </div>
            <label>Activa desde</label>
            <input type="month" value={mesInicio} onChange={(e) => setMesInicio(e.target.value)} />
          </>
        )}

        {/* categoría / fuente */}
        <label>{kind === "ingreso" ? "Fuente" : kind === "suscripcion" ? "Nombre del servicio" : "Categoría"}</label>
        {esGastoSimple ? (
          <div className="fin-chips">
            {CAT_GASTO.map((c) => <button key={c} className={cat === c ? "on" : ""} onClick={() => setCat(c)}>{c}</button>)}
          </div>
        ) : (
          <input
            placeholder={kind === "ingreso" ? "Ej: Sueldo, Cliente X" : kind === "suscripcion" ? "Ej: Netflix, Spotify, Gimnasio" : "Ej: Notebook, Heladera"}
            value={cat} onChange={(e) => setCat(e.target.value)}
          />
        )}

        {/* medio de pago para gasto simple */}
        {esGastoSimple && (
          <>
            <label>Medio de pago</label>
            <div className="fin-seg sm">
              {MEDIOS.map((m) => <button key={m.k} className={medio === m.k ? "on" : ""} onClick={() => setMedio(m.k)}>{m.l}</button>)}
            </div>
          </>
        )}

        {/* fecha para gasto/ingreso simple */}
        {(kind === "gasto" || kind === "ingreso") && (
          <>
            <label>Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </>
        )}

        {/* nota */}
        <label>Nota (opcional)</label>
        <input placeholder="detalle" value={desc} onChange={(e) => setDesc(e.target.value)} />

        {/* preview cuotas */}
        {kind === "cuotas" && montoN > 0 && (
          <div className="fin-preview">
            {cantN} cuotas de <b>{fmt(valorCuota, moneda)}</b> · total <b>{fmt(totalCuotas, moneda)}</b>
            <br />Desde {mesLabel(mesInicio)} hasta {mesLabel(addMes(mesInicio, cantN - 1))}
          </div>
        )}
        {kind === "suscripcion" && montoN > 0 && (
          <div className="fin-preview">
            <b>{fmt(montoN, moneda)}</b> cada mes, día {diaDebito}, hasta que la des de baja.
          </div>
        )}

        <div className="fin-modal-actions">
          <button className="ghost" onClick={onClose}>Cancelar</button>
          <button className="primary" onClick={submit} disabled={saving || montoN <= 0}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
