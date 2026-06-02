import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-cambiame";

// ----------------------------------------------------------------
//  MODELOS
// ----------------------------------------------------------------
const userSchema = new mongoose.Schema(
  {
    usuario: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passHash: { type: String, required: true },
    rol: { type: String, enum: ["admin", "normal"], default: "normal" },
  },
  { timestamps: true }
);
const User = mongoose.model("User", userSchema);

const movSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tipo: { type: String, enum: ["ingreso", "gasto"], required: true },
    monto: { type: Number, required: true },
    moneda: { type: String, enum: ["ARS", "USD"], default: "ARS" },
    tc: { type: Number, default: 1 },
    cat: { type: String, default: "Otros" },
    desc: { type: String, default: "" },
    medioPago: { type: String, enum: ["efectivo", "debito", "credito", null], default: null },
    fecha: { type: Date, default: Date.now },
    mes: { type: String, required: true },
    grupoId: { type: String, default: null, index: true },
    cuotaNum: { type: Number, default: null },
    cuotaTotal: { type: Number, default: null },
  },
  { timestamps: true }
);
const Movimiento = mongoose.model("Movimiento", movSchema);

const recurrenteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tipo: { type: String, enum: ["ingreso", "gasto"], default: "gasto" },
    monto: { type: Number, required: true },
    moneda: { type: String, enum: ["ARS", "USD"], default: "ARS" },
    tc: { type: Number, default: 1 },
    cat: { type: String, default: "Suscripción" },
    desc: { type: String, default: "" },
    medioPago: { type: String, enum: ["efectivo", "debito", "credito", null], default: "debito" },
    diaDebito: { type: Number, default: 1 },
    mesInicio: { type: String, required: true },
    mesBaja: { type: String, default: null },
  },
  { timestamps: true }
);
const Recurrente = mongoose.model("Recurrente", recurrenteSchema);

const configSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    inflacion: { type: Object, default: {} },
    monedaDisplay: { type: String, default: "ARS" },
    tcDefault: { type: Number, default: 1000 },
  },
  { minimize: false }
);
const Config = mongoose.model("Config", configSchema);

// ----------------------------------------------------------------
//  AUTH
// ----------------------------------------------------------------
function signToken(user) {
  return jwt.sign({ id: user._id, usuario: user.usuario, rol: user.rol }, JWT_SECRET, { expiresIn: "90d" });
}

// verifica contra la DB que el usuario sea admin (no confía solo en el token)
async function adminOnly(req, res, next) {
  const u = await User.findById(req.userId).select("rol");
  if (!u || u.rol !== "admin") return res.status(403).json({ error: "Solo el admin puede hacer esto" });
  next();
}

async function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "sin token" });
  try {
    const p = jwt.verify(token, JWT_SECRET);
    req.userId = p.id;
    next();
  } catch {
    return res.status(401).json({ error: "token inválido" });
  }
}

app.post("/api/auth/register", async (req, res) => {
  try {
    const usuario = String(req.body.usuario || "").toLowerCase().trim();
    const pass = String(req.body.pass || "");
    if (usuario.length < 3 || pass.length < 4)
      return res.status(400).json({ error: "Usuario (3+) y contraseña (4+) requeridos" });
    const existe = await User.findOne({ usuario });
    if (existe) return res.status(409).json({ error: "Ese usuario ya existe" });
    const passHash = await bcrypt.hash(pass, 10);
    const total = await User.countDocuments();
    const rol = total === 0 ? "admin" : "normal"; // el primero es admin
    const user = await User.create({ usuario, passHash, rol });
    await Config.create({ userId: user._id });
    res.status(201).json({ token: signToken(user), usuario, rol });
  } catch (e) {
    res.status(500).json({ error: "Error al registrar" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const usuario = String(req.body.usuario || "").toLowerCase().trim();
    const pass = String(req.body.pass || "");
    const user = await User.findOne({ usuario });
    if (!user) return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    const ok = await bcrypt.compare(pass, user.passHash);
    if (!ok) return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    res.json({ token: signToken(user), usuario, rol: user.rol });
  } catch {
    res.status(500).json({ error: "Error al ingresar" });
  }
});

// ----------------------------------------------------------------
//  MOVIMIENTOS
// ----------------------------------------------------------------
const addMesStr = (mes, delta) => {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

app.get("/api/movimientos", auth, async (req, res) => {
  const m = await Movimiento.find({ userId: req.userId }).sort({ fecha: 1, createdAt: 1 });
  res.json(m);
});

app.post("/api/movimientos", auth, async (req, res) => {
  const fecha = req.body.fecha ? new Date(req.body.fecha) : new Date();
  const mes = fecha.getFullYear() + "-" + String(fecha.getMonth() + 1).padStart(2, "0");
  const m = await Movimiento.create({ ...req.body, fecha, mes, userId: req.userId });
  res.status(201).json(m);
});

app.post("/api/movimientos/cuotas", auth, async (req, res) => {
  const { modo, montoTotal, montoCuota, cantidad, mesInicio, diaImpacto = 1, moneda, tc, cat, desc, medioPago = "credito" } = req.body;
  const n = Math.max(1, Math.min(120, Number(cantidad) || 1));
  let base = modo === "total" ? Math.round((Number(montoTotal) || 0) / n) : Number(montoCuota) || 0;
  if (base <= 0) return res.status(400).json({ error: "Monto inválido" });
  const total = modo === "total" ? Number(montoTotal) : base * n;
  const grupoId = new mongoose.Types.ObjectId().toString();
  const docs = [];
  let acumulado = 0;
  for (let i = 0; i < n; i++) {
    let monto = base;
    if (modo === "total" && i === n - 1) monto = total - acumulado;
    acumulado += monto;
    const mes = addMesStr(mesInicio, i);
    const [y, mm] = mes.split("-").map(Number);
    const dia = Math.min(diaImpacto, new Date(y, mm, 0).getDate());
    docs.push({
      userId: req.userId, tipo: "gasto", monto, moneda: moneda || "ARS", tc: tc || 1,
      cat: cat || "Cuotas", desc, medioPago, fecha: new Date(y, mm - 1, dia), mes,
      grupoId, cuotaNum: i + 1, cuotaTotal: n,
    });
  }
  const creados = await Movimiento.insertMany(docs);
  res.status(201).json(creados);
});

app.delete("/api/movimientos/grupo/:grupoId", auth, async (req, res) => {
  await Movimiento.deleteMany({ userId: req.userId, grupoId: req.params.grupoId });
  res.json({ ok: true });
});

app.delete("/api/movimientos/:id", auth, async (req, res) => {
  await Movimiento.deleteOne({ _id: req.params.id, userId: req.userId });
  res.json({ ok: true });
});

app.delete("/api/movimientos", auth, async (req, res) => {
  await Movimiento.deleteMany({ userId: req.userId });
  res.json({ ok: true });
});

// ----------------------------------------------------------------
//  RECURRENTES
// ----------------------------------------------------------------
app.get("/api/recurrentes", auth, async (req, res) => {
  const r = await Recurrente.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json(r);
});
app.post("/api/recurrentes", auth, async (req, res) => {
  const r = await Recurrente.create({ ...req.body, userId: req.userId });
  res.status(201).json(r);
});
app.put("/api/recurrentes/:id", auth, async (req, res) => {
  const r = await Recurrente.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId }, req.body, { new: true }
  );
  res.json(r);
});
app.delete("/api/recurrentes/:id", auth, async (req, res) => {
  await Recurrente.deleteOne({ _id: req.params.id, userId: req.userId });
  res.json({ ok: true });
});

// ----------------------------------------------------------------
//  CONFIG
// ----------------------------------------------------------------
app.get("/api/config", auth, async (req, res) => {
  let c = await Config.findOne({ userId: req.userId });
  if (!c) c = await Config.create({ userId: req.userId });
  res.json(c);
});
app.put("/api/config", auth, async (req, res) => {
  const c = await Config.findOneAndUpdate({ userId: req.userId }, req.body, {
    new: true, upsert: true, setDefaultsOnInsert: true,
  });
  res.json(c);
});

// ----------------------------------------------------------------
//  ADMIN — gestión de usuarios (solo rol admin)
// ----------------------------------------------------------------
app.get("/api/admin/usuarios", auth, adminOnly, async (req, res) => {
  const users = await User.find().select("usuario rol createdAt").sort({ createdAt: 1 });
  res.json(users);
});

// el admin crea un usuario (queda como normal salvo que indique admin)
app.post("/api/admin/usuarios", auth, adminOnly, async (req, res) => {
  const usuario = String(req.body.usuario || "").toLowerCase().trim();
  const pass = String(req.body.pass || "");
  const rol = req.body.rol === "admin" ? "admin" : "normal";
  if (usuario.length < 3 || pass.length < 4)
    return res.status(400).json({ error: "Usuario (3+) y contraseña (4+) requeridos" });
  if (await User.findOne({ usuario })) return res.status(409).json({ error: "Ese usuario ya existe" });
  const passHash = await bcrypt.hash(pass, 10);
  const user = await User.create({ usuario, passHash, rol });
  await Config.create({ userId: user._id });
  res.status(201).json({ _id: user._id, usuario: user.usuario, rol: user.rol, createdAt: user.createdAt });
});

// resetear contraseña de un usuario
app.put("/api/admin/usuarios/:id/pass", auth, adminOnly, async (req, res) => {
  const pass = String(req.body.pass || "");
  if (pass.length < 4) return res.status(400).json({ error: "La contraseña debe tener 4+ caracteres" });
  const passHash = await bcrypt.hash(pass, 10);
  await User.findByIdAndUpdate(req.params.id, { passHash });
  res.json({ ok: true });
});

// cambiar rol
app.put("/api/admin/usuarios/:id/rol", auth, adminOnly, async (req, res) => {
  const rol = req.body.rol === "admin" ? "admin" : "normal";
  if (req.params.id === req.userId && rol !== "admin")
    return res.status(400).json({ error: "No podés sacarte el rol de admin a vos mismo" });
  const u = await User.findByIdAndUpdate(req.params.id, { rol }, { new: true }).select("usuario rol");
  res.json(u);
});

// borrar usuario (y todos sus datos)
app.delete("/api/admin/usuarios/:id", auth, adminOnly, async (req, res) => {
  if (req.params.id === req.userId) return res.status(400).json({ error: "No podés borrarte a vos mismo" });
  const id = req.params.id;
  await Promise.all([
    User.findByIdAndDelete(id),
    Movimiento.deleteMany({ userId: id }),
    Recurrente.deleteMany({ userId: id }),
    Config.deleteOne({ userId: id }),
  ]);
  res.json({ ok: true });
});

app.get("/", (_req, res) => res.send("Finanzas API ok"));

const PORT = process.env.PORT || 4000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log("API escuchando en :" + PORT)))
  .catch((e) => {
    console.error("Error conectando a Mongo:", e.message);
    process.exit(1);
  });
