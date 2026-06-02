export const C = {
  bg: "#0a0c0b", surface: "#13161a", surface2: "#181c20", surface3: "#1f2429",
  border: "rgba(255,255,255,0.07)", borderStrong: "rgba(255,255,255,0.14)",
  text: "#e9ece6", muted: "#828a82", faint: "#5a615a",
  pos: "#5fe3b3", neg: "#ff8a7a", gold: "#e8c06a", line: "#9bb1ff", credit: "#c79bff",
};

export const styles = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
body { margin: 0; }
.fin-loading { background: ${C.bg}; color: ${C.muted}; min-height: 100vh; display: grid; place-items: center; font-family: monospace; }
.fin-root { font-family: 'Bricolage Grotesque', system-ui, sans-serif; background: ${C.bg}; color: ${C.text};
  min-height: 100vh; max-width: 480px; margin: 0 auto; padding: 16px 16px calc(92px + env(safe-area-inset-bottom));
  -webkit-font-smoothing: antialiased; }
.fin-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }

/* header */
.fin-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; padding-top: env(safe-area-inset-top); }
.fin-hello { font-size: 12px; color: ${C.muted}; }
.fin-hello b { color: ${C.text}; }
.fin-head-actions { display: flex; gap: 8px; align-items: center; }
.fin-cur-toggle { display: flex; background: ${C.surface}; border-radius: 11px; padding: 3px; }
.fin-cur-toggle button { background: none; border: none; color: ${C.muted}; padding: 8px 11px; border-radius: 8px;
  font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 600; cursor: pointer; transition: .15s; }
.fin-cur-toggle button.on { background: ${C.surface3}; color: ${C.text}; }
.fin-icon-btn { background: ${C.surface}; border: 1px solid ${C.border}; color: ${C.text}; width: 40px; height: 40px;
  border-radius: 12px; font-size: 19px; cursor: pointer; display: grid; place-items: center; }
.fin-menu-wrap { position: relative; }
.fin-menu { position: absolute; right: 0; top: 46px; background: ${C.surface2}; border: 1px solid ${C.borderStrong};
  border-radius: 14px; overflow: hidden; z-index: 40; min-width: 180px; box-shadow: 0 12px 40px rgba(0,0,0,.5); }
.fin-menu button { display: block; width: 100%; text-align: left; background: none; border: none; color: ${C.text};
  padding: 13px 16px; font-size: 14px; cursor: pointer; font-family: inherit; }
.fin-menu button:active { background: ${C.surface3}; }
.fin-menu button.danger { color: ${C.neg}; }

.fin-err { background: rgba(255,138,122,.12); border: 1px solid ${C.neg}; color: ${C.neg};
  padding: 11px 13px; border-radius: 12px; font-size: 12.5px; margin-bottom: 14px; }

/* month nav */
.fin-month-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.fin-month-nav span { font-size: 16px; font-weight: 600; text-transform: capitalize; }
.fin-month-nav button { background: ${C.surface}; border: 1px solid ${C.border}; color: ${C.text}; width: 38px; height: 38px;
  border-radius: 11px; font-size: 19px; cursor: pointer; }

/* cards */
.fin-hero { background: linear-gradient(160deg, ${C.surface3}, ${C.surface}); border: 1px solid ${C.border};
  border-radius: 20px; padding: 20px; margin-bottom: 12px; }
.fin-hero-label { font-size: 12.5px; color: ${C.muted}; margin-bottom: 6px; }
.fin-hero-value { font-size: 34px; font-weight: 800; letter-spacing: -.02em; line-height: 1; }
.fin-hero-sub { font-size: 12px; color: ${C.muted}; margin-top: 8px; display: flex; gap: 14px; }
.fin-hero-sub b { font-weight: 600; }
.fin-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
.fin-card { background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 16px; padding: 14px 15px;
  display: flex; flex-direction: column; gap: 5px; }
.fin-card-label { font-size: 12px; color: ${C.muted}; }
.fin-card-value { font-size: 19px; font-weight: 600; }
.fin-card-sub { font-size: 11px; color: ${C.muted}; }

/* secciones */
.fin-section { margin-bottom: 24px; }
.fin-section-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
.fin-section h2 { font-size: 18px; font-weight: 700; margin: 0; letter-spacing: -.01em; }
.fin-section-action { background: none; border: none; color: ${C.line}; font-family: inherit; font-size: 13px; cursor: pointer; }
.fin-sub { font-size: 12.5px; color: ${C.muted}; margin: 0 0 12px; line-height: 1.4; }
.fin-empty { color: ${C.muted}; font-size: 13px; padding: 8px 0; }

/* alerta deuda tarjeta */
.fin-debt { display: flex; align-items: center; gap: 12px; background: ${C.surface}; border: 1px solid ${C.border};
  border-left: 3px solid ${C.credit}; border-radius: 14px; padding: 14px 15px; margin-bottom: 16px; }
.fin-debt-ico { font-size: 20px; }
.fin-debt-info { flex: 1; }
.fin-debt-info span { display: block; font-size: 12px; color: ${C.muted}; }
.fin-debt-info b { font-size: 17px; font-family: 'IBM Plex Mono', monospace; color: ${C.credit}; }

/* categorías */
.fin-cat { margin-bottom: 12px; }
.fin-cat-top { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 5px; }
.fin-cat-track { height: 7px; background: ${C.surface}; border-radius: 4px; overflow: hidden; }
.fin-cat-fill { height: 100%; background: ${C.neg}; border-radius: 4px; transition: width .4s; }

/* movimientos */
.fin-mov { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid ${C.border}; }
.fin-mov-ico { width: 38px; height: 38px; border-radius: 11px; display: grid; place-items: center; font-size: 16px; flex-shrink: 0;
  background: ${C.surface}; }
.fin-mov-info { flex: 1; display: flex; flex-direction: column; min-width: 0; gap: 2px; }
.fin-mov-cat { font-size: 14.5px; font-weight: 500; display: flex; align-items: center; gap: 7px; }
.fin-mov-meta { font-size: 11.5px; color: ${C.muted}; }
.fin-tagpill { font-size: 10px; padding: 1px 6px; border-radius: 5px; font-weight: 600; }
.fin-tagpill.credito { background: rgba(199,155,255,.16); color: ${C.credit}; }
.fin-tagpill.cuota { background: rgba(232,192,106,.16); color: ${C.gold}; }
.fin-tagpill.sub { background: rgba(155,177,255,.16); color: ${C.line}; }
.fin-mov-monto { font-size: 14.5px; font-weight: 600; white-space: nowrap; font-family: 'IBM Plex Mono', monospace; }
.fin-del { background: none; border: none; color: ${C.faint}; font-size: 22px; cursor: pointer; padding: 0 2px; line-height: 1; }

/* suscripciones */
.fin-sub-card { display: flex; align-items: center; gap: 12px; padding: 14px 0; border-bottom: 1px solid ${C.border}; }
.fin-sub-info { flex: 1; }
.fin-sub-info b { font-size: 14.5px; font-weight: 600; }
.fin-sub-info span { display: block; font-size: 12px; color: ${C.muted}; }
.fin-sub-monto { font-family: 'IBM Plex Mono', monospace; font-size: 14px; }
.fin-sub-baja { background: ${C.surface}; border: 1px solid ${C.border}; color: ${C.neg}; padding: 7px 11px;
  border-radius: 9px; font-family: inherit; font-size: 12px; cursor: pointer; }
.fin-badge-baja { font-size: 11px; color: ${C.faint}; }

/* evolución */
.fin-evo-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; font-size: 13px; color: ${C.muted}; }
.fin-evo-controls b { color: ${C.text}; }
.fin-real { background: ${C.surface}; border: 1px solid ${C.border}; color: ${C.muted}; padding: 8px 12px;
  border-radius: 10px; font-family: inherit; font-size: 12.5px; cursor: pointer; }
.fin-real.on { background: ${C.gold}; color: #1c1404; border-color: ${C.gold}; font-weight: 600; }
.fin-legend { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 10px; font-size: 12px; color: ${C.muted}; }
.fin-legend span { display: flex; align-items: center; gap: 6px; }
.fin-legend i { width: 10px; height: 10px; border-radius: 3px; }
.fin-hist-row { display: flex; justify-content: space-between; align-items: center; width: 100%; background: none;
  border: none; border-bottom: 1px solid ${C.border}; color: ${C.text}; padding: 14px 0; font-family: inherit;
  font-size: 14px; text-transform: capitalize; cursor: pointer; }

/* ajustes */
.fin-tc-row { display: flex; gap: 10px; }
.fin-tc-row input { flex: 1; background: ${C.bg}; border: 1px solid ${C.border}; border-radius: 12px; color: ${C.text}; padding: 13px; font-size: 16px; }
.fin-tc-row button { background: ${C.pos}; color: #04130d; border: none; border-radius: 12px; padding: 0 20px; font-family: inherit; font-weight: 700; cursor: pointer; }
.fin-infl-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid ${C.border}; font-size: 14px; }
.fin-infl-input { display: flex; align-items: center; gap: 6px; }
.fin-infl-input input { width: 84px; background: ${C.bg}; border: 1px solid ${C.border}; border-radius: 10px; color: ${C.text}; padding: 9px; text-align: right; font-size: 15px; }
.fin-infl-input span { color: ${C.muted}; }

/* bottom nav */
.fin-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px;
  display: flex; justify-content: space-around; align-items: center; background: rgba(19,22,26,.92);
  backdrop-filter: blur(16px); border-top: 1px solid ${C.border}; padding: 8px 8px calc(8px + env(safe-area-inset-bottom)); z-index: 30; }
.fin-nav button { background: none; border: none; color: ${C.faint}; font-family: inherit; font-size: 10.5px; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 6px 14px; border-radius: 12px; flex: 1; }
.fin-nav button.on { color: ${C.text}; }
.fin-nav button .ico { font-size: 20px; }
.fin-fab { width: 56px; height: 56px; border-radius: 50%; background: ${C.pos}; color: #04130d; border: none;
  font-size: 30px; font-weight: 300; cursor: pointer; display: grid; place-items: center; margin-top: -22px;
  box-shadow: 0 8px 24px rgba(95,227,179,.35); flex: 0 0 auto; }
.fin-fab:active { transform: scale(.94); }

/* modal */
.fin-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.65); backdrop-filter: blur(4px); z-index: 100;
  display: flex; align-items: flex-end; justify-content: center; }
.fin-modal { background: ${C.surface2}; border: 1px solid ${C.borderStrong}; border-radius: 24px 24px 0 0; width: 100%;
  max-width: 480px; padding: 10px 18px calc(28px + env(safe-area-inset-bottom)); max-height: 94vh; overflow-y: auto; animation: up .28s cubic-bezier(.2,.8,.2,1); }
@keyframes up { from { transform: translateY(60px); opacity: 0; } }
.fin-grip { width: 38px; height: 4px; background: ${C.borderStrong}; border-radius: 3px; margin: 6px auto 14px; }
.fin-modal h3 { font-size: 21px; font-weight: 700; margin: 0 0 4px; }
.fin-modal label { display: block; font-size: 12px; color: ${C.muted}; margin: 16px 0 7px; }
.fin-tag { background: ${C.surface}; color: ${C.muted}; padding: 2px 7px; border-radius: 6px; font-size: 10.5px; margin-left: 4px; }
.fin-modal input, .fin-modal select { width: 100%; background: ${C.bg}; border: 1px solid ${C.border}; border-radius: 12px;
  color: ${C.text}; padding: 14px; font-family: inherit; font-size: 16px; }
.fin-modal input:focus, .fin-modal select:focus { outline: none; border-color: ${C.borderStrong}; }
.fin-kind { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 6px 0 4px; }
.fin-kind button { background: ${C.bg}; border: 1px solid ${C.border}; color: ${C.muted}; padding: 13px 10px; border-radius: 13px;
  font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.fin-kind button .ico { font-size: 19px; }
.fin-kind button.on { border-color: ${C.text}; color: ${C.text}; background: ${C.surface3}; }
.fin-seg { display: flex; gap: 6px; background: ${C.bg}; padding: 4px; border-radius: 12px; }
.fin-seg.sm { padding: 3px; }
.fin-seg button { flex: 1; background: none; border: none; color: ${C.muted}; padding: 12px; border-radius: 9px;
  font-family: inherit; font-size: 15px; font-weight: 600; cursor: pointer; }
.fin-seg.sm button { padding: 10px; font-family: 'IBM Plex Mono', monospace; font-size: 13px; }
.fin-seg button.on { background: ${C.surface3}; color: ${C.text}; }
.fin-seg button.on.neg { background: ${C.neg}; color: #1a0703; }
.fin-seg button.on.pos { background: ${C.pos}; color: #04130d; }
.fin-monto-row { display: flex; gap: 8px; }
.fin-monto-row > input { flex: 1; }
.fin-monto-row > .fin-seg { flex: 0 0 auto; }
.fin-row2 { display: flex; gap: 10px; }
.fin-row2 > div { flex: 1; }
.fin-chips { display: flex; flex-wrap: wrap; gap: 7px; }
.fin-chips button { background: ${C.bg}; border: 1px solid ${C.border}; color: ${C.text}; padding: 9px 12px;
  border-radius: 10px; font-family: inherit; font-size: 13px; cursor: pointer; }
.fin-chips button.on { background: ${C.text}; color: ${C.bg}; border-color: ${C.text}; }
.fin-hint { font-size: 12px; color: ${C.muted}; margin: 8px 0 0; line-height: 1.4; }
.fin-preview { background: ${C.surface}; border: 1px dashed ${C.borderStrong}; border-radius: 12px; padding: 12px 14px;
  margin-top: 14px; font-size: 13px; color: ${C.muted}; }
.fin-preview b { color: ${C.text}; font-family: 'IBM Plex Mono', monospace; }
.fin-modal-actions { display: flex; gap: 10px; margin-top: 22px; }
.fin-modal-actions button { flex: 1; padding: 15px; border-radius: 13px; font-family: inherit; font-size: 15px; font-weight: 700; cursor: pointer; border: none; }
.fin-modal-actions .ghost { background: none; border: 1px solid ${C.border}; color: ${C.text}; }
.fin-modal-actions .primary { background: ${C.pos}; color: #04130d; }
.fin-modal-actions .primary:disabled { opacity: .55; }

/* auth */
.fin-auth { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; max-width: 380px; margin: 0 auto; padding: 24px; }
.fin-auth-brand { text-align: center; margin-bottom: 36px; }
.fin-auth-brand .logo { font-size: 40px; }
.fin-auth-brand h1 { font-size: 30px; font-weight: 800; margin: 8px 0 4px; letter-spacing: -.02em; }
.fin-auth-brand p { color: ${C.muted}; font-size: 13.5px; margin: 0; }
.fin-auth label { display: block; font-size: 12px; color: ${C.muted}; margin: 14px 0 7px; }
.fin-auth input { width: 100%; background: ${C.surface}; border: 1px solid ${C.border}; border-radius: 13px; color: ${C.text}; padding: 15px; font-family: inherit; font-size: 16px; }
.fin-auth input:focus { outline: none; border-color: ${C.borderStrong}; }
.fin-auth-btn { width: 100%; background: ${C.pos}; color: #04130d; border: none; border-radius: 14px; padding: 16px; font-family: inherit; font-size: 16px; font-weight: 700; cursor: pointer; margin-top: 22px; }
.fin-auth-btn:disabled { opacity: .6; }
.fin-auth-switch { text-align: center; margin-top: 20px; font-size: 14px; color: ${C.muted}; }
.fin-auth-switch button { background: none; border: none; color: ${C.line}; font-family: inherit; font-size: 14px; cursor: pointer; text-decoration: underline; }
.fin-auth-err { background: rgba(255,138,122,.12); border: 1px solid ${C.neg}; color: ${C.neg}; padding: 11px 13px; border-radius: 12px; font-size: 13px; margin-top: 16px; text-align: center; }

.fin-foot { text-align: center; font-size: 11px; color: ${C.faint}; margin-top: 28px; }

/* admin */
.fin-admin-row { display: flex; align-items: center; justify-content: space-between; padding: 13px 0; border-bottom: 1px solid ${C.border}; }
.fin-admin-info { display: flex; align-items: center; gap: 9px; }
.fin-admin-info b { font-size: 14.5px; font-weight: 600; }
.fin-rol-pill { font-size: 10px; padding: 2px 8px; border-radius: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
.fin-rol-pill.admin { background: rgba(232,192,106,.16); color: ${C.gold}; }
.fin-rol-pill.normal { background: ${C.surface}; color: ${C.muted}; }
.fin-admin-actions { display: flex; gap: 6px; }
.fin-admin-actions button { background: ${C.surface}; border: 1px solid ${C.border}; color: ${C.text}; width: 36px; height: 36px;
  border-radius: 10px; font-size: 15px; cursor: pointer; display: grid; place-items: center; }
.fin-admin-actions button.danger { color: ${C.neg}; }
`;
