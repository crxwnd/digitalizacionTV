import express from "express";

const app = express();
const PORT = process.env.PORT || 5000;

app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "Backend funcionando correctamente" });
});

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});