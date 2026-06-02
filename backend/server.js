import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

// ---- auth simple por token (opcional, recomendado) ----
const TOKEN = process.env.API_TOKEN;
app.use("/api", (req, res, next) => {
  if (!TOKEN) return next();                       // sin token => abierto
  if (req.headers["x-api-token"] === TOKEN) return next();
  return res.status(401).json({ error: "no autorizado" });
});

// ---- modelos ----
const movSchema = new mongoose.Schema(
  {
    tipo: { type: String, enum: ["ingreso", "gasto"], required: true },
    monto: { type: Number, required: true },          // en la moneda indicada
    moneda: { type: String, enum: ["ARS", "USD"], default: "ARS" },
    tc: { type: Number, default: 1 },                 // ARS por 1 USD al momento de cargar
    cat: { type: String, default: "Otros" },
    cuad: { type: String, enum: ["E", "S", "B", "I", null], default: null },
    desc: { type: String, default: "" },
    mes: { type: String, required: true },            // 'YYYY-MM'
  },
  { timestamps: true }
);
const Movimiento = mongoose.model("Movimiento", movSchema);

const configSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "main" },
    inflacion: { type: Object, default: {} },         // { 'YYYY-MM': pct mensual }
    monedaDisplay: { type: String, default: "ARS" },
    tcDefault: { type: Number, default: 1000 },
  },
  { minimize: false }
);
const Config = mongoose.model("Config", configSchema);

// ---- rutas: movimientos ----
app.get("/api/movimientos", async (_req, res) => {
  const m = await Movimiento.find().sort({ mes: 1, createdAt: 1 });
  res.json(m);
});
app.post("/api/movimientos", async (req, res) => {
  const m = await Movimiento.create(req.body);
  res.status(201).json(m);
});
app.post("/api/movimientos/bulk", async (req, res) => {
  const m = await Movimiento.insertMany(req.body);
  res.status(201).json(m);
});
app.delete("/api/movimientos/:id", async (req, res) => {
  await Movimiento.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});
app.delete("/api/movimientos", async (_req, res) => {
  await Movimiento.deleteMany({});
  res.json({ ok: true });
});

// ---- rutas: config ----
app.get("/api/config", async (_req, res) => {
  let c = await Config.findById("main");
  if (!c) c = await Config.create({ _id: "main" });
  res.json(c);
});
app.put("/api/config", async (req, res) => {
  const c = await Config.findByIdAndUpdate("main", req.body, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  });
  res.json(c);
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
